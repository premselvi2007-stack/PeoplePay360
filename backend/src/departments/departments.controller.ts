import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(@Body() body: { name: string; code: string; managerId?: string }) {
    return this.departmentsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(@Param('id') id: string, @Body() body: { name?: string; code?: string; managerId?: string }) {
    return this.departmentsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }
}
