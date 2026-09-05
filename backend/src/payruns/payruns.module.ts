import { Module } from '@nestjs/common';
import { PayrunsService } from './payruns.service';
import { PayrunsController } from './payruns.controller';
import { ContractsModule } from '../contracts/contracts.module';
import { RuleEngineModule } from '../rule-engine/rule-engine.module';
import { EmailModule } from '../notifications/email.module';

@Module({
  imports: [ContractsModule, RuleEngineModule, EmailModule],
  providers: [PayrunsService],
  controllers: [PayrunsController],
  exports: [PayrunsService],
})
export class PayrunsModule {}
