import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractResolutionService } from './contract-resolution.service';

export interface CreateContractInput {
  employeeId: string;
  departmentId?: string;
  jobPositionId?: string;
  workingScheduleId?: string;
  salaryStructureId: string;
  wage: number;
  startDate: string | Date;
  endDate?: string | Date | null;
  status?: string;
  contractType?: string;
  notes?: string;
}

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private contractResolutionService: ContractResolutionService,
  ) {}

  async findAll(employeeId?: string, status?: string) {
    return this.prisma.contract.findMany({
      where: {
        employeeId: employeeId || undefined,
        status: status || undefined,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            workEmail: true,
          },
        },
        salaryStructure: true,
        department: true,
        jobPosition: true,
        workingSchedule: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        employee: true,
        salaryStructure: {
          include: {
            rules: {
              where: { isActive: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        department: true,
        jobPosition: true,
        workingSchedule: {
          include: { scheduleDays: true },
        },
        payslips: {
          take: 5,
          orderBy: { periodStartDate: 'desc' },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async create(data: CreateContractInput) {
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be prior to start date');
    }

    // Check for overlapping contracts if status is RUNNING
    if (data.status === 'RUNNING' || !data.status) {
      const { hasOverlap, conflictingContract } =
        await this.contractResolutionService.validateContractOverlap(
          data.employeeId,
          startDate,
          endDate,
        );

      if (hasOverlap) {
        throw new BadRequestException(
          `Cannot create active contract: Overlaps with existing contract ${conflictingContract.contractReference} (${new Date(conflictingContract.startDate).toISOString().split('T')[0]} to ${conflictingContract.endDate ? new Date(conflictingContract.endDate).toISOString().split('T')[0] : 'ongoing'})`,
        );
      }
    }

    const count = await this.prisma.contract.count();
    const contractReference = `CTR-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.contract.create({
      data: {
        contractReference,
        employeeId: data.employeeId,
        departmentId: data.departmentId || null,
        jobPositionId: data.jobPositionId || null,
        workingScheduleId: data.workingScheduleId || null,
        salaryStructureId: data.salaryStructureId,
        wage: Number(data.wage),
        startDate,
        endDate,
        status: data.status || 'RUNNING',
        contractType: data.contractType || 'FULL_TIME',
        notes: data.notes,
      },
      include: {
        employee: true,
        salaryStructure: true,
        department: true,
        jobPosition: true,
      },
    });
  }

  async update(id: string, data: Partial<CreateContractInput>) {
    const existing = await this.findOne(id);
    const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
    const endDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : existing.endDate;

    if (endDate && endDate < startDate) {
      throw new BadRequestException('End date cannot be prior to start date');
    }

    if (data.status === 'RUNNING' || (existing.status === 'RUNNING' && data.status !== 'CANCELLED' && data.status !== 'EXPIRED')) {
      const { hasOverlap, conflictingContract } =
        await this.contractResolutionService.validateContractOverlap(
          existing.employeeId,
          startDate,
          endDate,
          id,
        );

      if (hasOverlap) {
        throw new BadRequestException(
          `Update rejected: Overlaps with running contract ${conflictingContract.contractReference}`,
        );
      }
    }

    return this.prisma.contract.update({
      where: { id },
      data: {
        ...data,
        wage: data.wage !== undefined ? Number(data.wage) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
      },
      include: {
        employee: true,
        salaryStructure: true,
        department: true,
        jobPosition: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contract.delete({ where: { id } });
  }
}
