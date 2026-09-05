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
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
  ) {
    return this.contractsService.findAll(employeeId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  create(@Body() body: any) {
    return this.contractsService.create(body);
  }

  @Patch(':id')
  @Roles(Role.HR_MANAGER, Role.HR_PAYROLL_MANAGER, Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any) {
    return this.contractsService.update(id, body);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.contractsService.remove(id);
  }
}
