import { Module } from '@nestjs/common';
import { SalaryRulesService } from './salary-rules.service';
import { SalaryRulesController } from './salary-rules.controller';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';

@Module({
  imports: [RuleEngineModule],
  providers: [SalaryRulesService],
  controllers: [SalaryRulesController],
  exports: [SalaryRulesService],
})
export class SalaryRulesModule {}
