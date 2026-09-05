import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { TimeOffService, CreateAllocationDto, CreateRequestDto, CreateTimeOffTypeDto } from './time-off.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('time-off')
export class TimeOffController {
  constructor(private readonly timeOffService: TimeOffService) {}

  // ================= TYPES =================
  @Get('types')
  getTypes() {
    return this.timeOffService.getTypes();
  }

  @Post('types')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  createType(@Body() body: CreateTimeOffTypeDto) {
    return this.timeOffService.createType(body);
  }

  @Patch('types/:id')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  updateType(@Param('id') id: string, @Body() body: Partial<CreateTimeOffTypeDto>) {
    return this.timeOffService.updateType(id, body);
  }

  // ================= ALLOCATIONS =================
  @Get('allocations')
  getAllocations(
    @Query('employeeId') employeeId?: string,
    @CurrentUser() user?: any,
  ) {
    return this.timeOffService.getAllocations(employeeId, user?.role, user?.employeeId);
  }

  @Post('allocations')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  createAllocation(@Body() body: CreateAllocationDto, @CurrentUser() user: any) {
    return this.timeOffService.createAllocation(body, user.id);
  }

  @Post('allocations/:id/approve')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  approveAllocation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeOffService.approveAllocation(id, user.id);
  }

  @Post('allocations/:id/refuse')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  refuseAllocation(@Param('id') id: string) {
    return this.timeOffService.refuseAllocation(id);
  }

  @Get('balances/:employeeId')
  getBalances(@Param('employeeId') employeeId: string, @CurrentUser() user: any) {
    if (user?.role === 'EMPLOYEE' && user?.employeeId !== employeeId) {
      throw new ForbiddenException('Cannot view leave balances of other employees');
    }
    return this.timeOffService.getEmployeeBalances(employeeId);
  }

  // ================= REQUESTS =================
  @Get('requests')
  getRequests(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.timeOffService.getRequests(employeeId, status, user?.role, user?.employeeId);
  }

  @Post('requests')
  createRequest(@Body() body: CreateRequestDto, @CurrentUser() user: any) {
    const targetEmpId = (user.role === 'EMPLOYEE' || !body.employeeId) ? user.employeeId : body.employeeId;
    if (!targetEmpId) throw new ForbiddenException('No employee ID associated');
    return this.timeOffService.createRequest({ ...body, employeeId: targetEmpId });
  }

  @Post('requests/:id/approve')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  approveRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.timeOffService.approveRequest(id, user.id);
  }

  @Post('requests/:id/refuse')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  refuseRequest(@Param('id') id: string, @Body('refusalReason') refusalReason?: string) {
    return this.timeOffService.refuseRequest(id, refusalReason);
  }
}
