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
import { SalaryRulesService, TestRuleCalculationInput } from './salary-rules.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salary-rules')
export class SalaryRulesController {
  constructor(private readonly salaryRulesService: SalaryRulesService) {}

  @Get()
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findAll(@Query('salaryStructureId') salaryStructureId?: string) {
    return this.salaryRulesService.findAll(salaryStructureId);
  }

  @Get(':id')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.salaryRulesService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(@Body() body: any) {
    return this.salaryRulesService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.salaryRulesService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.salaryRulesService.remove(id);
  }

  @Post('test-sandbox')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  testCalculation(@Body() body: TestRuleCalculationInput) {
    return this.salaryRulesService.testCalculation(body);
  }
}
