import { Module } from '@nestjs/common';
import { SalaryStructuresService } from './salary-structures.service';
import { SalaryStructuresController } from './salary-structures.controller';

@Module({
  providers: [SalaryStructuresService],
  controllers: [SalaryStructuresController],
  exports: [SalaryStructuresService],
})
export class SalaryStructuresModule {}
