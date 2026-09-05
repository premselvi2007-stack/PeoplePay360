import { PrismaClient } from '@prisma/client';

export class ReportsService {
  constructor(private prisma: PrismaClient) {}

  async getPayrollSummaryReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.periodStartDate = {};
      if (startDate) where.periodStartDate.gte = new Date(startDate);
      if (endDate) where.periodStartDate.lte = new Date(endDate);
    }

    const payruns = await this.prisma.payrun.findMany({
      where,
      include: {
        salaryStructure: true,
        payslips: {
          include: {
            employee: {
              select: {
                firstName: true,
                lastName: true,
                employeeCode: true,
                department: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { periodStartDate: 'desc' },
    });

    return payruns.map((pr) => ({
      payrunId: pr.id,
      name: pr.name,
      period: `${pr.periodStartDate.toISOString().split('T')[0]} to ${pr.periodEndDate.toISOString().split('T')[0]}`,
      structure: pr.salaryStructure.name,
      status: pr.status,
      employeeCount: pr.employeeCount,
      totalGross: pr.totalGross,
      totalDeduction: pr.totalDeduction,
      totalNet: pr.totalNet,
      paidAt: pr.paidAt,
    }));
  }

  async getAttendanceReport(month?: string) {
    const d = month ? new Date(month) : new Date();
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    const summaryByEmployee: Record<string, any> = {};

    for (const a of attendances) {
      const eid = a.employeeId;
      if (!summaryByEmployee[eid]) {
        summaryByEmployee[eid] = {
          employee: a.employee,
          totalDays: 0,
          present: 0,
          late: 0,
          overtime: 0,
          totalWorkedHours: 0,
        };
      }
      summaryByEmployee[eid].totalDays++;
      if (a.status === 'PRESENT') summaryByEmployee[eid].present++;
      if (a.status === 'LATE') summaryByEmployee[eid].late++;
      if (a.status === 'OVERTIME') summaryByEmployee[eid].overtime++;
      summaryByEmployee[eid].totalWorkedHours += a.workedHours;
    }

    return Object.values(summaryByEmployee);
  }
}
