import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PrismaClient } from '@prisma/client';

export interface CreateTimeOffTypeDto {
  name: string;
  code: string;
  unit?: string;
  requiresAllocation?: boolean;
  approvalMode?: string;
  colorHex?: string;
  isActive?: boolean;
}

export interface CreateAllocationDto {
  employeeId: string;
  timeOffTypeId: string;
  allocatedAmount: number;
  validityStartDate: string | Date;
  validityEndDate?: string | Date | null;
  notes?: string;
  autoApprove?: boolean;
}

export interface CreateRequestDto {
  employeeId?: string; // If submitted by employee
  timeOffTypeId: string;
  startDate: string | Date;
  endDate: string | Date;
  duration?: number;
  reason?: string;
}

export class TimeOffService {
  constructor(private prisma: PrismaClient) {}

  // ==================== TIME OFF TYPES ====================
  async getTypes() {
    return this.prisma.timeOffType.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createType(data: CreateTimeOffTypeDto) {
    return this.prisma.timeOffType.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        unit: data.unit || 'DAYS',
        requiresAllocation: data.requiresAllocation !== undefined ? data.requiresAllocation : true,
        approvalMode: data.approvalMode || 'BY_TIME_OFF_OFFICER',
        colorHex: data.colorHex || '#714B67',
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateType(id: string, data: Partial<CreateTimeOffTypeDto>) {
    return this.prisma.timeOffType.update({
      where: { id },
      data,
    });
  }

  // ==================== ALLOCATIONS ====================
  async getAllocations(employeeId?: string, userRole?: string, userEmpId?: string) {
    const where: any = {};
    if (userRole === 'EMPLOYEE' && userEmpId) {
      where.employeeId = userEmpId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    return this.prisma.timeOffAllocation.findMany({
      where,
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
        timeOffType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAllocation(data: CreateAllocationDto, currentUserId?: string) {
    return this.prisma.timeOffAllocation.create({
      data: {
        employeeId: data.employeeId,
        timeOffTypeId: data.timeOffTypeId,
        allocatedAmount: Number(data.allocatedAmount),
        takenAmount: 0.0,
        status: data.autoApprove ? 'APPROVED' : 'DRAFT',
        validityStartDate: new Date(data.validityStartDate),
        validityEndDate: data.validityEndDate ? new Date(data.validityEndDate) : null,
        notes: data.notes,
        approvedById: data.autoApprove ? currentUserId : null,
        approvedAt: data.autoApprove ? new Date() : null,
      },
      include: {
        employee: true,
        timeOffType: true,
      },
    });
  }

  async approveAllocation(id: string, approverUserId: string) {
    const allocation = await this.prisma.timeOffAllocation.findUnique({ where: { id } });
    if (!allocation) throw new NotFoundException('Allocation not found');
    if (allocation.status === 'APPROVED') return allocation;

    return this.prisma.timeOffAllocation.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: approverUserId,
        approvedAt: new Date(),
      },
      include: { employee: true, timeOffType: true },
    });
  }

  async refuseAllocation(id: string) {
    return this.prisma.timeOffAllocation.update({
      where: { id },
      data: { status: 'REFUSED' },
    });
  }

  // ==================== BALANCES SUMMARY ====================
  async getEmployeeBalances(employeeId: string) {
    const allocations = await this.prisma.timeOffAllocation.findMany({
      where: {
        employeeId,
        status: 'APPROVED',
      },
      include: { timeOffType: true },
    });

    const balanceMap: Record<
      string,
      {
        typeId: string;
        typeName: string;
        typeCode: string;
        colorHex: string;
        unit: string;
        requiresAllocation: boolean;
        allocated: number;
        taken: number;
        remaining: number;
      }
    > = {};

    for (const alloc of allocations) {
      const tid = alloc.timeOffTypeId;
      if (!balanceMap[tid]) {
        balanceMap[tid] = {
          typeId: tid,
          typeName: alloc.timeOffType.name,
          typeCode: alloc.timeOffType.code,
          colorHex: alloc.timeOffType.colorHex,
          unit: alloc.timeOffType.unit,
          requiresAllocation: alloc.timeOffType.requiresAllocation,
          allocated: 0,
          taken: 0,
          remaining: 0,
        };
      }
      balanceMap[tid].allocated += alloc.allocatedAmount;
      balanceMap[tid].taken += alloc.takenAmount;
      balanceMap[tid].remaining = balanceMap[tid].allocated - balanceMap[tid].taken;
    }

    return Object.values(balanceMap);
  }

  // ==================== REQUESTS ====================
  async getRequests(employeeId?: string, status?: string, userRole?: string, userEmpId?: string) {
    const where: any = {};
    if (userRole === 'EMPLOYEE' && userEmpId) {
      where.employeeId = userEmpId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) where.status = status;

    return this.prisma.timeOffRequest.findMany({
      where,
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
        timeOffType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(data: CreateRequestDto) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be prior to start date');
    }

    // Derive duration in days if not supplied
    let duration = data.duration;
    if (!duration) {
      const diffMs = endDate.getTime() - startDate.getTime();
      duration = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }

    const type = await this.prisma.timeOffType.findUnique({
      where: { id: data.timeOffTypeId },
    });
    if (!type) throw new NotFoundException('Time off type not found');

    // If requires allocation, check available balance
    if (type.requiresAllocation && data.employeeId) {
      const balances = await this.getEmployeeBalances(data.employeeId);
      const matchingBalance = balances.find((b) => b.typeId === data.timeOffTypeId);
      const remaining = matchingBalance ? matchingBalance.remaining : 0;

      if (remaining < duration) {
        throw new BadRequestException(
          `Insufficient leave balance for ${type.name}. Requested: ${duration} ${type.unit}, Available: ${remaining} ${type.unit}`,
        );
      }
    }

    return this.prisma.timeOffRequest.create({
      data: {
        employeeId: data.employeeId!,
        timeOffTypeId: data.timeOffTypeId,
        startDate,
        endDate,
        duration,
        status: 'SUBMITTED',
        reason: data.reason,
      },
      include: {
        employee: true,
        timeOffType: true,
      },
    });
  }

  async approveRequest(id: string, approverUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.timeOffRequest.findUnique({
        where: { id },
        include: { timeOffType: true },
      });

      if (!request) throw new NotFoundException('Leave request not found');
      if (request.status === 'APPROVED') {
        return request; // Idempotent
      }

      // If requires allocation, deduct from available allocation
      if (request.timeOffType.requiresAllocation) {
        const allocations = await tx.timeOffAllocation.findMany({
          where: {
            employeeId: request.employeeId,
            timeOffTypeId: request.timeOffTypeId,
            status: 'APPROVED',
          },
          orderBy: { validityStartDate: 'asc' },
        });

        let needed = request.duration;
        let totalAvailable = 0;
        for (const alloc of allocations) {
          totalAvailable += alloc.allocatedAmount - alloc.takenAmount;
        }

        if (totalAvailable < needed) {
          throw new BadRequestException(
            `Cannot approve request: Insufficient remaining allocation balance (${totalAvailable} available vs ${needed} requested)`,
          );
        }

        // Deduct from allocation records
        for (const alloc of allocations) {
          if (needed <= 0) break;
          const remainingInAlloc = alloc.allocatedAmount - alloc.takenAmount;
          if (remainingInAlloc > 0) {
            const deduct = Math.min(remainingInAlloc, needed);
            await tx.timeOffAllocation.update({
              where: { id: alloc.id },
              data: { takenAmount: alloc.takenAmount + deduct },
            });
            needed -= deduct;
          }
        }
      }

      return tx.timeOffRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: approverUserId,
          approvedAt: new Date(),
        },
        include: {
          employee: true,
          timeOffType: true,
        },
      });
    });
  }

  async refuseRequest(id: string, refusalReason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.timeOffRequest.findUnique({
        where: { id },
        include: { timeOffType: true },
      });

      if (!request) throw new NotFoundException('Leave request not found');

      // If it was already approved, refund the taken balance
      if (request.status === 'APPROVED' && request.timeOffType.requiresAllocation) {
        let toRefund = request.duration;
        const allocations = await tx.timeOffAllocation.findMany({
          where: {
            employeeId: request.employeeId,
            timeOffTypeId: request.timeOffTypeId,
            status: 'APPROVED',
          },
          orderBy: { validityStartDate: 'desc' },
        });

        for (const alloc of allocations) {
          if (toRefund <= 0) break;
          if (alloc.takenAmount > 0) {
            const refund = Math.min(alloc.takenAmount, toRefund);
            await tx.timeOffAllocation.update({
              where: { id: alloc.id },
              data: { takenAmount: alloc.takenAmount - refund },
            });
            toRefund -= refund;
          }
        }
      }

      return tx.timeOffRequest.update({
        where: { id },
        data: {
          status: 'REFUSED',
          refusalReason,
        },
        include: { employee: true, timeOffType: true },
      });
    });
  }
}
