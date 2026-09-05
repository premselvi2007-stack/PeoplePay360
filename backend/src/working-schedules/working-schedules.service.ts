import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ScheduleDayInput {
  dayOfWeek: string;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  breakHours: number;// 1.0
  isWorkingDay: boolean;
}

@Injectable()
export class WorkingSchedulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper: Calculate total hours worked in a single day
   */
  private calculateDayHours(startTime: string, endTime: string, breakHours: number, isWorkingDay: boolean): number {
    if (!isWorkingDay) return 0;
    try {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      const startMinutes = sH * 60 + sM;
      const endMinutes = eH * 60 + eM;
      const durationHours = (endMinutes - startMinutes) / 60;
      const netHours = Math.max(0, durationHours - (breakHours || 0));
      return Number(netHours.toFixed(2));
    } catch {
      return 8.0;
    }
  }

  async findAll() {
    return this.prisma.workingSchedule.findMany({
      include: {
        scheduleDays: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            employees: true,
            contracts: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.workingSchedule.findUnique({
      where: { id },
      include: {
        scheduleDays: true,
        employees: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
          },
        },
        contracts: {
          where: { status: 'RUNNING' },
          select: {
            id: true,
            contractReference: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!schedule) throw new NotFoundException('Working schedule not found');
    return schedule;
  }

  async create(data: {
    name: string;
    scheduleType?: string;
    isActive?: boolean;
    scheduleDays?: ScheduleDayInput[];
  }) {
    const existing = await this.prisma.workingSchedule.findUnique({
      where: { name: data.name },
    });
    if (existing) throw new ConflictException('A working schedule with this name already exists');

    // Default 7 days if not provided
    const defaultDays: ScheduleDayInput[] = [
      { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true },
      { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true },
      { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true },
      { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true },
      { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true },
      { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '14:00', breakHours: 0.0, isWorkingDay: false },
      { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '18:00', breakHours: 0.0, isWorkingDay: false },
    ];

    const inputDays = data.scheduleDays && data.scheduleDays.length > 0 ? data.scheduleDays : defaultDays;

    let totalWeeklyHours = 0;
    const computedDays = inputDays.map((d) => {
      const dayHours = this.calculateDayHours(d.startTime, d.endTime, d.breakHours, d.isWorkingDay);
      totalWeeklyHours += dayHours;
      return {
        dayOfWeek: d.dayOfWeek,
        startTime: d.startTime,
        endTime: d.endTime,
        breakHours: d.breakHours,
        isWorkingDay: d.isWorkingDay,
        dayHours,
      };
    });

    return this.prisma.workingSchedule.create({
      data: {
        name: data.name,
        scheduleType: data.scheduleType || 'STANDARD_40H',
        calculatedWeeklyHours: Number(totalWeeklyHours.toFixed(2)),
        isActive: data.isActive !== undefined ? data.isActive : true,
        scheduleDays: {
          create: computedDays,
        },
      },
      include: {
        scheduleDays: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      scheduleType?: string;
      isActive?: boolean;
      scheduleDays?: ScheduleDayInput[];
    },
  ) {
    await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      if (data.scheduleDays && data.scheduleDays.length > 0) {
        await tx.workingScheduleDay.deleteMany({
          where: { workingScheduleId: id },
        });

        let totalWeeklyHours = 0;
        const computedDays = data.scheduleDays.map((d) => {
          const dayHours = this.calculateDayHours(d.startTime, d.endTime, d.breakHours, d.isWorkingDay);
          totalWeeklyHours += dayHours;
          return {
            workingScheduleId: id,
            dayOfWeek: d.dayOfWeek,
            startTime: d.startTime,
            endTime: d.endTime,
            breakHours: d.breakHours,
            isWorkingDay: d.isWorkingDay,
            dayHours,
          };
        });

        await tx.workingScheduleDay.createMany({
          data: computedDays,
        });

        return tx.workingSchedule.update({
          where: { id },
          data: {
            name: data.name,
            scheduleType: data.scheduleType,
            isActive: data.isActive,
            calculatedWeeklyHours: Number(totalWeeklyHours.toFixed(2)),
          },
          include: { scheduleDays: true },
        });
      } else {
        return tx.workingSchedule.update({
          where: { id },
          data: {
            name: data.name,
            scheduleType: data.scheduleType,
            isActive: data.isActive,
          },
          include: { scheduleDays: true },
        });
      }
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.workingSchedule.delete({ where: { id } });
  }
}
