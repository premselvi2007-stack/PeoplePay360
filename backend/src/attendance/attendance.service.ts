import { NotFoundException, BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '../common/errors';
import { PrismaClient } from '@prisma/client';

export interface CheckInDto {
  employeeId?: string; // Optional if derived from CurrentUser
  timestamp?: string | Date;
}

export interface ManualCorrectionDto {
  date: string | Date;
  checkIn?: string | Date | null;
  checkOut?: string | Date | null;
  status: string;
  correctionNotes: string;
}

export class AttendanceService {
  constructor(private prisma: PrismaClient) {}

  private calculateWorkedHours(checkIn: Date | null, checkOut: Date | null): number {
    if (!checkIn || !checkOut) return 0;
    const diffMs = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diffMs <= 0) return 0;
    const hours = diffMs / (1000 * 60 * 60);
    return Number(hours.toFixed(2));
  }

  async findAll(query?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    userRole?: string;
    userEmployeeId?: string;
  }) {
    const where: any = {};

    // Regular employee can only view their own attendance
    if (query?.userRole === 'EMPLOYEE' && query?.userEmployeeId) {
      where.employeeId = query.userEmployeeId;
    } else if (query?.employeeId) {
      where.employeeId = query.employeeId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.startDate || query?.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            workingSchedule: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getTodayStatus(employeeId: string) {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        OR: [
          { date: today },
          { date: { gte: startOfDay, lte: endOfDay } },
        ],
      },
    });

    return {
      today,
      record,
      isCheckedIn: !!(record?.checkIn && !record?.checkOut),
      isCheckedOut: !!record?.checkOut,
    };
  }

  async checkIn(employeeId: string, timestamp?: string | Date) {
    const now = timestamp ? new Date(timestamp) : new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        OR: [
          { date: today },
          { date: { gte: startOfDay, lte: endOfDay } },
        ],
      },
    });

    if (existing && existing.checkIn) {
      if (!existing.checkOut) {
        throw new BadRequestException('Employee is already checked in. Please punch out when done.');
      }
      // If already checked out today, allow resuming shift
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: null,
          status: 'PRESENT',
        },
      });
    }

    // Determine if late (after 09:15)
    let status = 'PRESENT';
    if (now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 15)) {
      status = 'LATE';
    }

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: now,
          status,
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: now,
        status,
        workedHours: 0,
      },
    });
  }

  async checkOut(employeeId: string, timestamp?: string | Date) {
    const now = timestamp ? new Date(timestamp) : new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        OR: [
          { date: today },
          { date: { gte: startOfDay, lte: endOfDay } },
        ],
      },
    });

    if (!existing || !existing.checkIn) {
      throw new BadRequestException('No check-in record found for today. Please check in first.');
    }

    const workedHours = this.calculateWorkedHours(existing.checkIn, now);

    let status = existing.status;
    if (workedHours >= 9.0) {
      status = 'OVERTIME';
    }

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        workedHours,
        status,
      },
    });
  }

  async manualCorrection(
    employeeId: string,
    correction: ManualCorrectionDto,
    adminUserId: string,
  ) {
    const targetDate = new Date(correction.date);
    targetDate.setHours(0, 0, 0, 0);

    const checkIn = correction.checkIn ? new Date(correction.checkIn) : null;
    const checkOut = correction.checkOut ? new Date(correction.checkOut) : null;
    const workedHours = this.calculateWorkedHours(checkIn, checkOut);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: targetDate,
      },
    });

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn,
          checkOut,
          workedHours,
          status: correction.status || 'MANUALLY_CORRECTED',
          isCorrected: true,
          correctedById: adminUserId,
          correctionNotes: correction.correctionNotes,
        },
      });
    } else {
      return this.prisma.attendance.create({
        data: {
          employeeId,
          date: targetDate,
          checkIn,
          checkOut,
          workedHours,
          status: correction.status || 'MANUALLY_CORRECTED',
          isCorrected: true,
          correctedById: adminUserId,
          correctionNotes: correction.correctionNotes,
        },
      });
    }
  }
}
