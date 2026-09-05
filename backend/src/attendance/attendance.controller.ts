import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AttendanceService, ManualCorrectionDto } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.attendanceService.findAll({
      employeeId,
      startDate,
      endDate,
      status,
      userRole: user?.role,
      userEmployeeId: user?.employeeId,
    });
  }

  @Get('today')
  getTodayStatus(@CurrentUser() user: any) {
    if (!user?.employeeId) {
      throw new ForbiddenException('User is not linked to an employee profile');
    }
    return this.attendanceService.getTodayStatus(user.employeeId);
  }

  @Post('check-in')
  checkIn(
    @CurrentUser() user: any,
    @Body('employeeId') employeeId?: string,
    @Body('timestamp') timestamp?: string,
  ) {
    const targetEmpId = (user.role === 'EMPLOYEE' || !employeeId) ? user.employeeId : employeeId;
    if (!targetEmpId) throw new ForbiddenException('No employee ID resolved');
    return this.attendanceService.checkIn(targetEmpId, timestamp);
  }

  @Post('check-out')
  checkOut(
    @CurrentUser() user: any,
    @Body('employeeId') employeeId?: string,
    @Body('timestamp') timestamp?: string,
  ) {
    const targetEmpId = (user.role === 'EMPLOYEE' || !employeeId) ? user.employeeId : employeeId;
    if (!targetEmpId) throw new ForbiddenException('No employee ID resolved');
    return this.attendanceService.checkOut(targetEmpId, timestamp);
  }

  @Post('manual-correction')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  manualCorrection(
    @CurrentUser() user: any,
    @Body('employeeId') employeeId: string,
    @Body('correction') correction: ManualCorrectionDto,
  ) {
    return this.attendanceService.manualCorrection(employeeId, correction, user.id);
  }
}
