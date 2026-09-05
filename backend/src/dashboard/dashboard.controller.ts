import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService, DashboardFilter } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('payroll')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  getPayrollDashboard(
    @Query('periodStartDate') periodStartDate?: string,
    @Query('periodEndDate') periodEndDate?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.dashboardService.getPayrollMetrics({
      periodStartDate,
      periodEndDate,
      departmentId,
    });
  }
}
