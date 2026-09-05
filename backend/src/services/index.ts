import { prisma } from '../prisma';
import { RuleEngineService } from '../rule-engine/rule-engine.service';
import { ContractResolutionService } from '../contracts/contract-resolution.service';
import { EmailService } from '../notifications/email.service';
import { PdfService } from '../pdf/pdf.service';
import { PayrunsService } from '../payruns/payruns.service';
import { PayslipsService } from '../payslips/payslips.service';
import { AttendanceService } from '../attendance/attendance.service';
import { TimeOffService } from '../time-off/time-off.service';
import { ReportsService } from '../reports/reports.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { UsersService } from '../users/users.service';
import { EmployeesService } from '../employees/employees.service';
import { ContractsService } from '../contracts/contracts.service';
import { DepartmentsService } from '../departments/departments.service';
import { JobPositionsService } from '../job-positions/job-positions.service';
import { WorkingSchedulesService } from '../working-schedules/working-schedules.service';
import { SalaryStructuresService } from '../salary-structures/salary-structures.service';
import { SalaryRulesService } from '../salary-rules/salary-rules.service';
import { AuditService } from '../audit/audit.service';

// Initialize singletons
export const ruleEngineService = new RuleEngineService();
export const contractResolutionService = new ContractResolutionService(prisma);
export const emailService = new EmailService();
export const pdfService = new PdfService();

export const payrunsService = new PayrunsService(
  prisma,
  contractResolutionService,
  ruleEngineService,
  emailService,
);

export const payslipsService = new PayslipsService(prisma, pdfService);
export const attendanceService = new AttendanceService(prisma);
export const timeOffService = new TimeOffService(prisma);
export const reportsService = new ReportsService(prisma);
export const dashboardService = new DashboardService(prisma);
export const usersService = new UsersService(prisma);
export const employeesService = new EmployeesService(prisma);
export const contractsService = new ContractsService(prisma, contractResolutionService);
export const departmentsService = new DepartmentsService(prisma);
export const jobPositionsService = new JobPositionsService(prisma);
export const workingSchedulesService = new WorkingSchedulesService(prisma);
export const salaryStructuresService = new SalaryStructuresService(prisma);
export const salaryRulesService = new SalaryRulesService(prisma, ruleEngineService);
export const auditService = new AuditService(prisma);
