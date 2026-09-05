import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkingSchedulesService, ScheduleDayInput } from './working-schedules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('working-schedules')
export class WorkingSchedulesController {
  constructor(private readonly workingSchedulesService: WorkingSchedulesService) {}

  @Get()
  findAll() {
    return this.workingSchedulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workingSchedulesService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(
    @Body()
    body: {
      name: string;
      scheduleType?: string;
      isActive?: boolean;
      scheduleDays?: ScheduleDayInput[];
    },
  ) {
    return this.workingSchedulesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      scheduleType?: string;
      isActive?: boolean;
      scheduleDays?: ScheduleDayInput[];
    },
  ) {
    return this.workingSchedulesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.workingSchedulesService.remove(id);
  }
}
