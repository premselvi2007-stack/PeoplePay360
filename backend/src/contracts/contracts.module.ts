import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { ContractResolutionService } from './contract-resolution.service';

@Module({
  providers: [ContractsService, ContractResolutionService],
  controllers: [ContractsController],
  exports: [ContractsService, ContractResolutionService],
})
export class ContractsModule {}
