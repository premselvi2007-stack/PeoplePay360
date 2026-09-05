import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  workEmail: string;
  privateEmail?: string;
  phone?: string;
  avatarUrl?: string;
  departmentId?: string;
  jobPositionId?: string;
  managerId?: string;
  workingScheduleId?: string;
  company?: string;
  workLocation?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscOrRouting?: string;
  status?: string;
  hireDate?: Date | string;
}

export interface EmployeeQueryOptions {
  search?: string;
  departmentId?: string;
  jobPositionId?: string;
  status?: string;
  view?: 'list' | 'kanban';
}

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: EmployeeQueryOptions, userRole?: string, userEmployeeId?: string) {
    const whereClause: any = {};

    if (query?.departmentId) {
      whereClause.departmentId = query.departmentId;
    }
    if (query?.jobPositionId) {
      whereClause.jobPositionId = query.jobPositionId;
    }
    if (query?.status) {
      whereClause.status = query.status;
    }

    if (query?.search) {
      const s = query.search.toLowerCase().trim();
      whereClause.OR = [
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { workEmail: { contains: s } },
        { employeeCode: { contains: s } },
      ];
    }

    return this.prisma.employee.findMany({
      where: whereClause,
      include: {
        department: true,
        jobPosition: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
        workingSchedule: {
          select: {
            id: true,
            name: true,
            calculatedWeeklyHours: true,
          },
        },
        contracts: {
          where: { status: 'RUNNING' },
          select: {
            id: true,
            contractReference: true,
            wage: true,
            startDate: true,
            salaryStructure: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: {
            contracts: true,
            attendances: true,
            timeOffRequests: true,
            timeOffAllocations: true,
            payslips: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userRole?: string, userEmployeeId?: string) {
    // Resource-level security: regular employee can only view their own record
    if (userRole === 'EMPLOYEE' && userEmployeeId && userEmployeeId !== id) {
      throw new ForbiddenException('You are not authorized to view this employee profile');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        jobPosition: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            workEmail: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            jobPosition: { select: { title: true } },
          },
        },
        workingSchedule: {
          include: { scheduleDays: true },
        },
        contracts: {
          orderBy: { startDate: 'desc' },
          include: {
            salaryStructure: true,
            department: true,
            jobPosition: true,
          },
        },
        attendances: {
          take: 10,
          orderBy: { date: 'desc' },
        },
        timeOffRequests: {
          take: 10,
          orderBy: { startDate: 'desc' },
          include: { timeOffType: true },
        },
        timeOffAllocations: {
          orderBy: { validityStartDate: 'desc' },
          include: { timeOffType: true },
        },
        payslips: {
          take: 10,
          orderBy: { periodStartDate: 'desc' },
          include: { payrun: true },
        },
        _count: {
          select: {
            contracts: true,
            attendances: true,
            timeOffRequests: true,
            timeOffAllocations: true,
            payslips: true,
          },
        },
      },
    });

    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(data: CreateEmployeeInput) {
    const existing = await this.prisma.employee.findUnique({
      where: { workEmail: data.workEmail.toLowerCase().trim() },
    });
    if (existing) throw new ConflictException('An employee with this work email already exists');

    const empCount = await this.prisma.employee.count();
    const employeeCode = `EMP-${String(empCount + 1).padStart(4, '0')}`;

    return this.prisma.employee.create({
      data: {
        employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        workEmail: data.workEmail.toLowerCase().trim(),
        privateEmail: data.privateEmail,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        departmentId: data.departmentId || null,
        jobPositionId: data.jobPositionId || null,
        managerId: data.managerId || null,
        workingScheduleId: data.workingScheduleId || null,
        company: data.company || 'Odoo Global Corp',
        workLocation: data.workLocation || 'Headquarters',
        bankName: data.bankName,
        bankAccountNumber: data.bankAccountNumber,
        bankIfscOrRouting: data.bankIfscOrRouting,
        status: data.status || 'ACTIVE',
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      },
      include: {
        department: true,
        jobPosition: true,
        workingSchedule: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateEmployeeInput>) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...data,
        workEmail: data.workEmail ? data.workEmail.toLowerCase().trim() : undefined,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      },
      include: {
        department: true,
        jobPosition: true,
        workingSchedule: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.employee.delete({ where: { id } });
  }
}
