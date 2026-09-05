import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salary-structures')
export class SalaryStructuresController {
  constructor(private readonly salaryStructuresService: SalaryStructuresService) {}

  @Get()
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findAll() {
    return this.salaryStructuresService.findAll();
  }

  @Get(':id')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.salaryStructuresService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(@Body() body: { name: string; code: string; description?: string; isActive?: boolean }) {
    return this.salaryStructuresService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; code?: string; description?: string; isActive?: boolean },
  ) {
    return this.salaryStructuresService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.salaryStructuresService.remove(id);
  }
}
