import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JobPositionsService } from './job-positions.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('job-positions')
export class JobPositionsController {
  constructor(private readonly jobPositionsService: JobPositionsService) {}

  @Get()
  findAll(@Query('departmentId') departmentId?: string) {
    return this.jobPositionsService.findAll(departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobPositionsService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(
    @Body()
    body: {
      title: string;
      code: string;
      departmentId: string;
      expectedSalaryMin?: number;
      expectedSalaryMax?: number;
    },
  ) {
    return this.jobPositionsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      code?: string;
      departmentId?: string;
      expectedSalaryMin?: number;
      expectedSalaryMax?: number;
    },
  ) {
    return this.jobPositionsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.jobPositionsService.remove(id);
  }
}
