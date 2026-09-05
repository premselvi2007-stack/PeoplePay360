import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findAll(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('jobPositionId') jobPositionId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    return this.employeesService.findAll(
      { search, departmentId, jobPositionId, status },
      user?.role,
      user?.employeeId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.employeesService.findOne(id, user?.role, user?.employeeId);
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(@Body() body: any) {
    return this.employeesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.employeesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }
}
