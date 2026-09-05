import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { DepartmentsModule } from './departments/departments.module';
import { JobPositionsModule } from './job-positions/job-positions.module';
import { WorkingSchedulesModule } from './working-schedules/working-schedules.module';
import { ContractsModule } from './contracts/contracts.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TimeOffModule } from './time-off/time-off.module';
import { SalaryStructuresModule } from './salary-structures/salary-structures.module';
import { SalaryRulesModule } from './salary-rules/salary-rules.module';
import { RuleEngineModule } from './rule-engine/rule-engine.module';
import { PayrunsModule } from './payruns/payruns.module';
import { PayslipsModule } from './payslips/payslips.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ReportsModule } from './reports/reports.module';
import { PdfModule } from './pdf/pdf.module';
import { EmailModule } from './notifications/email.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EmployeesModule,
    DepartmentsModule,
    JobPositionsModule,
    WorkingSchedulesModule,
    ContractsModule,
    AttendanceModule,
    TimeOffModule,
    SalaryStructuresModule,
    SalaryRulesModule,
    RuleEngineModule,
    PayrunsModule,
    PayslipsModule,
    DashboardModule,
    ReportsModule,
    PdfModule,
    EmailModule,
    AuditModule,
  ],
})
export class AppModule {}
