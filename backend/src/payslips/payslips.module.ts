import { Module } from '@nestjs/common';
import { PayslipsService } from './payslips.service';
import { PayslipsController } from './payslips.controller';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [PdfModule],
  providers: [PayslipsService],
  controllers: [PayslipsController],
  exports: [PayslipsService],
})
export class PayslipsModule {}
