import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PrismaClient } from '@prisma/client';
import { ContractResolutionService } from '../contracts/contract-resolution.service';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { EmailService } from '../notifications/email.service';

export interface EligibleEmployeesQuery {
  salaryStructureId: string;
  periodStartDate: string;
  periodEndDate: string;
  departmentId?: string;
  contractType?: string;
}

export interface CreatePayrunBatchDto {
  name: string;
  salaryStructureId: string;
  periodStartDate: string;
  periodEndDate: string;
  selectedEmployeeIds: string[];
}

export class PayrunsService {
  

  constructor(
    private prisma: PrismaClient,
    private contractResolutionService: ContractResolutionService,
    private ruleEngineService: RuleEngineService,
    private emailService: EmailService,
  ) {}

  async findAll(status?: string) {
    return this.prisma.payrun.findMany({
      where: status ? { status } : undefined,
      include: {
        salaryStructure: { select: { id: true, name: true, code: true } },
        _count: {
          select: { payslips: true, warnings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const payrun = await this.prisma.payrun.findUnique({
      where: { id },
      include: {
        salaryStructure: {
          include: {
            rules: {
              where: { isActive: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                workEmail: true,
                bankAccountNumber: true,
                department: { select: { name: true } },
                jobPosition: { select: { title: true } },
              },
            },
            contract: {
              select: {
                id: true,
                contractReference: true,
                wage: true,
                status: true,
              },
            },
            lines: {
              orderBy: { sequence: 'asc' },
            },
            warnings: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        warnings: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
    });

    if (!payrun) throw new NotFoundException('Payrun not found');
    return payrun;
  }

  /**
   * Wizard Step 2: Get eligible employees for the selected scope & period
   */
  async getEligibleEmployees(query: EligibleEmployeesQuery) {
    const periodStart = new Date(query.periodStartDate);
    const periodEnd = new Date(query.periodEndDate);

    const employees = await this.prisma.employee.findMany({
      where: {
        status: { in: ['ACTIVE', 'ON_LEAVE'] },
        departmentId: query.departmentId || undefined,
      },
      include: {
        department: true,
        jobPosition: true,
        workingSchedule: true,
      },
      orderBy: { firstName: 'asc' },
    });

    const eligibleList = [];

    for (const emp of employees) {
      const contractRes = await this.contractResolutionService.resolveContractForPeriod(
        emp.id,
        periodStart,
        periodEnd,
      );

      // Check if structure matches
      let structureMatches = false;
      if (contractRes.contract) {
        structureMatches = contractRes.contract.salaryStructureId === query.salaryStructureId;
      }

      const warnings: string[] = [];
      if (!emp.bankAccountNumber) {
        warnings.push('Missing bank account information');
      }
      if (!contractRes.isValid) {
        warnings.push(contractRes.warning || 'Invalid contract for period');
      } else if (!structureMatches) {
        warnings.push(`Contract assigned to different structure (${contractRes.contract?.salaryStructure?.name})`);
      }

      eligibleList.push({
        employee: emp,
        applicableContract: contractRes.contract,
        isValidContract: contractRes.isValid,
        structureMatches,
        isEligible: contractRes.isValid && structureMatches,
        warnings,
      });
    }

    return eligibleList;
  }

  /**
   * Wizard Step 2 Completion: Create the batch
   */
  async createBatch(dto: CreatePayrunBatchDto, currentUserId?: string) {
    if (!dto.selectedEmployeeIds || dto.selectedEmployeeIds.length === 0) {
      throw new BadRequestException('At least one employee must be selected for the payrun batch');
    }

    const periodStart = new Date(dto.periodStartDate);
    const periodEnd = new Date(dto.periodEndDate);

    if (periodEnd < periodStart) {
      throw new BadRequestException('Period end date cannot be prior to start date');
    }

    const payrun = await this.prisma.payrun.create({
      data: {
        name: dto.name,
        salaryStructureId: dto.salaryStructureId,
        periodStartDate: periodStart,
        periodEndDate: periodEnd,
        status: 'DRAFT',
        employeeCount: dto.selectedEmployeeIds.length,
        createdById: currentUserId,
      },
      include: {
        salaryStructure: true,
      },
    });

    // Compute payslips immediately upon batch creation
    await this.computePayrun(payrun.id);

    return this.findOne(payrun.id);
  }

  /**
   * Action: Compute Payroll (Transitions DRAFT -> COMPUTED)
   */
  async computePayrun(payrunId: string) {
    const payrun = await this.prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        salaryStructure: {
          include: {
            rules: {
              where: { isActive: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        payslips: true,
      },
    });

    if (!payrun) throw new NotFoundException('Payrun not found');
    if (payrun.status === 'PAID') {
      throw new BadRequestException('Cannot recompute a payrun that has already been MARKED AS PAID');
    }

    // Get employee IDs (either from existing payslips or eligible selection)
    let employeeIds: string[] = [];
    if (payrun.payslips.length > 0) {
      employeeIds = payrun.payslips.map((p) => p.employeeId);
    } else {
      // Find all employees associated with this structure
      const eligible = await this.getEligibleEmployees({
        salaryStructureId: payrun.salaryStructureId,
        periodStartDate: payrun.periodStartDate.toISOString(),
        periodEndDate: payrun.periodEndDate.toISOString(),
      });
      employeeIds = eligible.filter((e) => e.isEligible).map((e) => e.employee.id);
    }

    // Delete existing payslips and warnings for fresh clean recompute
    await this.prisma.payrollWarning.deleteMany({ where: { payrunId } });
    await this.prisma.payslip.deleteMany({ where: { payrunId } });

    let totalGross = 0;
    let totalDeduction = 0;
    let totalNet = 0;
    let warningCount = 0;

    const rules = payrun.salaryStructure.rules;

    for (const empId of employeeIds) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
        include: { workingSchedule: true, department: true },
      });
      if (!employee) continue;

      const contractRes = await this.contractResolutionService.resolveContractForPeriod(
        empId,
        payrun.periodStartDate,
        payrun.periodEndDate,
      );

      const payslipWarnings: string[] = [];
      let isBlocking = false;

      if (!contractRes.isValid || !contractRes.contract) {
        payslipWarnings.push(contractRes.warning || 'No valid contract found');
        isBlocking = true;
      }

      if (!employee.bankAccountNumber) {
        payslipWarnings.push('Employee missing bank account number');
      }

      // Fetch attendance in period
      const attendances = await this.prisma.attendance.findMany({
        where: {
          employeeId: empId,
          date: {
            gte: payrun.periodStartDate,
            lte: payrun.periodEndDate,
          },
        },
      });

      const workedDays = attendances.length > 0 ? attendances.length : 22;
      const actualWorkedHours = attendances.reduce((acc, a) => acc + (a.workedHours || 8.0), 0) || 176;

      // Fetch approved time-off requests in period
      const approvedLeaves = await this.prisma.timeOffRequest.findMany({
        where: {
          employeeId: empId,
          status: 'APPROVED',
          startDate: { lte: payrun.periodEndDate },
          endDate: { gte: payrun.periodStartDate },
        },
        include: { timeOffType: true },
      });

      let unpaidLeaveDays = 0;
      let paidLeaveDays = 0;
      for (const leave of approvedLeaves) {
        if (leave.timeOffType.code === 'UNPAID' || leave.timeOffType.name.toLowerCase().includes('unpaid')) {
          unpaidLeaveDays += leave.duration;
        } else {
          paidLeaveDays += leave.duration;
        }
      }

      const contractWage = contractRes.contract?.wage || 0;

      const payrollContext = {
        contractWage,
        workedDays,
        expectedWorkingDays: 22,
        expectedHours: 176,
        actualWorkedHours,
        unpaidLeaveDays,
        paidLeaveDays,
        overtimeHours: 0,
        variables: {},
      };

      const result = this.ruleEngineService.executeRules(rules as any, payrollContext);
      if (result.warnings.length > 0) {
        payslipWarnings.push(...result.warnings);
      }

      totalGross += result.totals.gross;
      totalDeduction += result.totals.deductions;
      totalNet += result.totals.net;

      // Create Payslip record
      if (contractRes.contract) {
        const payslip = await this.prisma.payslip.create({
          data: {
            payrunId: payrun.id,
            employeeId: empId,
            contractId: contractRes.contract.id,
            salaryStructureId: payrun.salaryStructureId,
            periodStartDate: payrun.periodStartDate,
            periodEndDate: payrun.periodEndDate,
            status: 'COMPUTED',
            workedDays,
            expectedWorkingHours: 176.0,
            actualWorkedHours,
            grossSalary: result.totals.gross,
            totalDeductions: result.totals.deductions,
            netSalary: result.totals.net,
            computedAt: new Date(),
            lines: {
              create: result.lines.map((l) => ({
                ruleCode: l.ruleCode,
                ruleName: l.ruleName,
                category: l.category,
                sequence: l.sequence,
                computationType: l.computationType,
                rateOrBase: l.rateOrBase,
                amount: l.amount,
                formulaSnapshot: l.formulaSnapshot,
              })),
            },
          },
        });

        // Record payslip-level warnings
        for (const w of payslipWarnings) {
          warningCount++;
          await this.prisma.payrollWarning.create({
            data: {
              payrunId: payrun.id,
              payslipId: payslip.id,
              employeeId: empId,
              warningType: isBlocking ? 'BLOCKING_ERROR' : 'BUSINESS_WARNING',
              message: w,
            },
          });
        }
      } else {
        // Record payrun warning without contract
        warningCount++;
        await this.prisma.payrollWarning.create({
          data: {
            payrunId: payrun.id,
            employeeId: empId,
            warningType: 'BLOCKING_ERROR',
            message: `Employee ${employee.firstName} ${employee.lastName} has no applicable contract for this period.`,
          },
        });
      }
    }

    // Update Payrun header
    await this.prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'COMPUTED',
        totalGross: Number(totalGross.toFixed(2)),
        totalDeduction: Number(totalDeduction.toFixed(2)),
        totalNet: Number(totalNet.toFixed(2)),
        employeeCount: employeeIds.length,
        warningCount,
        computedAt: new Date(),
      },
    });

    return this.findOne(payrunId);
  }

  /**
   * Action: Validate Payrun (COMPUTED -> VALIDATED)
   */
  async validatePayrun(payrunId: string) {
    const payrun = await this.findOne(payrunId);

    if (payrun.status === 'DRAFT') {
      throw new BadRequestException('Payrun must be computed before validation');
    }

    // Check for blocking errors
    const blockingWarnings = payrun.warnings.filter(
      (w) => w.warningType === 'BLOCKING_ERROR' && !w.isResolved,
    );

    if (blockingWarnings.length > 0) {
      throw new BadRequestException(
        `Cannot validate payrun: Contains ${blockingWarnings.length} unresolved blocking error(s): ${blockingWarnings.map((w) => w.message).join('; ')}`,
      );
    }

    await this.prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'VALIDATED',
        validatedAt: new Date(),
      },
    });

    await this.prisma.payslip.updateMany({
      where: { payrunId },
      data: { status: 'VERIFIED' },
    });

    return this.findOne(payrunId);
  }

  /**
   * Action: Mark Paid (VALIDATED -> PAID)
   */
  async markPaid(payrunId: string) {
    const payrun = await this.findOne(payrunId);

    if (payrun.status !== 'VALIDATED' && payrun.status !== 'COMPUTED') {
      throw new BadRequestException('Payrun must be validated or computed before marking as PAID');
    }

    await this.prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    await this.prisma.payslip.updateMany({
      where: { payrunId },
      data: { status: 'PAID' },
    });

    return this.findOne(payrunId);
  }

  /**
   * Action: Send Payslips via Email
   */
  async sendPayslips(payrunId: string) {
    const payrun = await this.findOne(payrunId);

    const sentResults = [];
    for (const payslip of payrun.payslips) {
      const email = payslip.employee?.workEmail;
      if (email) {
        await this.emailService.sendPayslipNotification({
          to: email,
          employeeName: `${payslip.employee.firstName} ${payslip.employee.lastName}`,
          period: `${payrun.periodStartDate.toISOString().split('T')[0]} - ${payrun.periodEndDate.toISOString().split('T')[0]}`,
          netSalary: payslip.netSalary,
          payslipId: payslip.id,
        });

        await this.prisma.payslip.update({
          where: { id: payslip.id },
          data: {
            isEmailSent: true,
            emailSentAt: new Date(),
          },
        });

        sentResults.push({ employeeId: payslip.employeeId, email, status: 'SENT' });
      }
    }

    return {
      message: `Successfully dispatched payslips to ${sentResults.length} employee(s).`,
      deliveries: sentResults,
    };
  }

  async remove(id: string) {
    const payrun = await this.findOne(id);
    if (payrun.status === 'PAID') {
      throw new BadRequestException('Cannot delete a payrun that has been marked as PAID');
    }
    return this.prisma.payrun.delete({ where: { id } });
  }
}
