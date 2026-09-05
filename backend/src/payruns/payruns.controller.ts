import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayrunsService, CreatePayrunBatchDto, EligibleEmployeesQuery } from './payruns.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payruns')
export class PayrunsController {
  constructor(private readonly payrunsService: PayrunsService) {}

  @Get()
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findAll(@Query('status') status?: string) {
    return this.payrunsService.findAll(status);
  }

  @Get('eligible-employees')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  getEligibleEmployees(@Query() query: EligibleEmployeesQuery) {
    return this.payrunsService.getEligibleEmployees(query);
  }

  @Get(':id')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.payrunsService.findOne(id);
  }

  @Post('create-batch')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  createBatch(@Body() body: CreatePayrunBatchDto, @CurrentUser() user: any) {
    return this.payrunsService.createBatch(body, user?.id);
  }

  @Post(':id/compute')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  compute(@Param('id') id: string) {
    return this.payrunsService.computePayrun(id);
  }

  @Post(':id/validate')
  @Roles(Role.HR_PAYROLL_USER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  validate(@Param('id') id: string) {
    return this.payrunsService.validatePayrun(id);
  }

  @Post(':id/mark-paid')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  markPaid(@Param('id') id: string) {
    return this.payrunsService.markPaid(id);
  }

  @Post(':id/send-payslips')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  sendPayslips(@Param('id') id: string) {
    return this.payrunsService.sendPayslips(id);
  }

  @Delete(':id')
  @Roles(Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.payrunsService.remove(id);
  }
}
