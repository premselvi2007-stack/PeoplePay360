import { Module } from '@nestjs/common';
import { WorkingSchedulesService } from './working-schedules.service';
import { WorkingSchedulesController } from './working-schedules.controller';

@Module({
  providers: [WorkingSchedulesService],
  controllers: [WorkingSchedulesController],
  exports: [WorkingSchedulesService],
})
export class WorkingSchedulesModule {}
