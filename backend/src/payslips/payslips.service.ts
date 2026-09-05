import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';

export interface PayslipsQuery {
  payrunId?: string;
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class PayslipsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
  ) {}

  async findAll(query?: PayslipsQuery, userRole?: string, userEmployeeId?: string) {
    const where: any = {};

    // Resource-level security: regular employee only views their own payslips
    if (userRole === 'EMPLOYEE' && userEmployeeId) {
      where.employeeId = userEmployeeId;
    } else if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query?.payrunId) where.payrunId = query.payrunId;
    if (query?.status) where.status = query.status;

    if (query?.startDate || query?.endDate) {
      where.periodStartDate = {};
      if (query.startDate) where.periodStartDate.gte = new Date(query.startDate);
      if (query.endDate) where.periodStartDate.lte = new Date(query.endDate);
    }

    return this.prisma.payslip.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            workEmail: true,
            department: { select: { id: true, name: true } },
            jobPosition: { select: { id: true, title: true } },
          },
        },
        payrun: {
          select: {
            id: true,
            name: true,
            status: true,
            periodStartDate: true,
            periodEndDate: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractReference: true,
            wage: true,
          },
        },
        salaryStructure: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { lines: true, warnings: true },
        },
      },
      orderBy: { periodStartDate: 'desc' },
    });
  }

  async findOne(id: string, userRole?: string, userEmployeeId?: string) {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            jobPosition: true,
            workingSchedule: true,
          },
        },
        payrun: true,
        contract: {
          include: { salaryStructure: true },
        },
        salaryStructure: true,
        lines: {
          orderBy: { sequence: 'asc' },
        },
        warnings: true,
      },
    });

    if (!payslip) throw new NotFoundException('Payslip not found');

    if (userRole === 'EMPLOYEE' && userEmployeeId && payslip.employeeId !== userEmployeeId) {
      throw new ForbiddenException('You are not authorized to view this payslip');
    }

    return payslip;
  }

  async getPdfBuffer(id: string, userRole?: string, userEmployeeId?: string): Promise<Buffer> {
    const payslip = await this.findOne(id, userRole, userEmployeeId);
    return this.pdfService.generatePayslipPdf(payslip);
  }
}
