export type UserRole =
  | 'EMPLOYEE'
  | 'HR_MANAGER'
  | 'HR_PAYROLL_USER'
  | 'HR_PAYROLL_MANAGER'
  | 'ADMIN';

export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'DRAFT';
export type ContractStatus = 'DRAFT' | 'RUNNING' | 'EXPIRED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'OVERTIME' | 'MISSING_CHECKOUT' | 'MANUALLY_CORRECTED';
export type AllocationStatus = 'DRAFT' | 'APPROVED' | 'REFUSED';
export type RequestStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REFUSED' | 'CANCELLED';
export type PayrunStatus = 'DRAFT' | 'COMPUTING' | 'COMPUTED' | 'VALIDATING' | 'VALIDATED' | 'PAID' | 'CANCELLED';
export type PayslipStatus = 'DRAFT' | 'COMPUTED' | 'VERIFIED' | 'PAID' | 'CANCELLED';
export type WarningType = 'BLOCKING_ERROR' | 'BUSINESS_WARNING' | 'DATA_EXCEPTION';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  employeeId?: string | null;
  employee?: Employee | null;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string | null;
  employees?: Employee[];
  _count?: {
    employees?: number;
    jobPositions?: number;
    contracts?: number;
  };
}

export interface JobPosition {
  id: string;
  title: string;
  code: string;
  departmentId: string;
  department?: Department;
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  _count?: {
    employees?: number;
    contracts?: number;
  };
}

export interface WorkingScheduleDay {
  id?: string;
  workingScheduleId?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  breakHours: number;
  isWorkingDay: boolean;
  dayHours: number;
}

export interface WorkingSchedule {
  id: string;
  name: string;
  scheduleType: string;
  calculatedWeeklyHours: number;
  isActive: boolean;
  scheduleDays?: WorkingScheduleDay[];
  _count?: {
    employees?: number;
    contracts?: number;
  };
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  workEmail: string;
  privateEmail?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  departmentId?: string | null;
  department?: Department | null;
  jobPositionId?: string | null;
  jobPosition?: JobPosition | null;
  managerId?: string | null;
  manager?: { id: string; firstName: string; lastName: string; employeeCode: string } | null;
  workingScheduleId?: string | null;
  workingSchedule?: WorkingSchedule | null;
  company: string;
  workLocation: string;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankIfscOrRouting?: string | null;
  status: EmployeeStatus;
  hireDate: string;
  contracts?: Contract[];
  attendances?: Attendance[];
  timeOffRequests?: TimeOffRequest[];
  timeOffAllocations?: TimeOffAllocation[];
  payslips?: Payslip[];
  _count?: {
    contracts?: number;
    attendances?: number;
    timeOffRequests?: number;
    timeOffAllocations?: number;
    payslips?: number;
  };
}

export interface Contract {
  id: string;
  contractReference: string;
  employeeId: string;
  employee?: Employee;
  departmentId?: string | null;
  department?: Department | null;
  jobPositionId?: string | null;
  jobPosition?: JobPosition | null;
  workingScheduleId?: string | null;
  workingSchedule?: WorkingSchedule | null;
  salaryStructureId: string;
  salaryStructure?: SalaryStructure;
  wage: number;
  startDate: string;
  endDate?: string | null;
  status: ContractStatus;
  contractType: string;
  notes?: string | null;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workedHours: number;
  status: AttendanceStatus;
  isCorrected: boolean;
  correctedById?: string | null;
  correctionNotes?: string | null;
}

export interface TimeOffType {
  id: string;
  name: string;
  code: string;
  unit: 'DAYS' | 'HOURS';
  requiresAllocation: boolean;
  approvalMode: string;
  colorHex: string;
  isActive: boolean;
}

export interface TimeOffAllocation {
  id: string;
  employeeId: string;
  employee?: Employee;
  timeOffTypeId: string;
  timeOffType?: TimeOffType;
  allocatedAmount: number;
  takenAmount: number;
  status: AllocationStatus;
  validityStartDate: string;
  validityEndDate?: string | null;
  notes?: string | null;
  approvedAt?: string | null;
}

export interface TimeOffRequest {
  id: string;
  employeeId: string;
  employee?: Employee;
  timeOffTypeId: string;
  timeOffType?: TimeOffType;
  startDate: string;
  endDate: string;
  duration: number;
  status: RequestStatus;
  reason?: string | null;
  refusalReason?: string | null;
  approvedAt?: string | null;
}

export interface LeaveBalance {
  typeId: string;
  typeName: string;
  typeCode: string;
  colorHex: string;
  unit: string;
  requiresAllocation: boolean;
  allocated: number;
  taken: number;
  remaining: number;
}

export interface SalaryRule {
  id: string;
  salaryStructureId: string;
  salaryStructure?: SalaryStructure;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  sequence: number;
  computationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  fixedAmount?: number | null;
  percentage?: number | null;
  percentageOf?: string | null;
  formula?: string | null;
  condition?: string | null;
  isActive: boolean;
}

export interface SalaryStructure {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  rules?: SalaryRule[];
  _count?: {
    rules?: number;
    contracts?: number;
    payruns?: number;
  };
}

export interface PayrollWarning {
  id: string;
  payslipId?: string | null;
  payrunId?: string | null;
  employeeId?: string | null;
  employee?: { firstName: string; lastName: string; employeeCode: string };
  warningType: WarningType;
  message: string;
  isResolved: boolean;
}

export interface PayslipLine {
  id: string;
  payslipId: string;
  ruleCode: string;
  ruleName: string;
  category: string;
  sequence: number;
  computationType: string;
  rateOrBase?: number | null;
  amount: number;
  formulaSnapshot?: string | null;
}

export interface Payslip {
  id: string;
  payrunId: string;
  payrun?: Payrun;
  employeeId: string;
  employee?: Employee;
  contractId: string;
  contract?: Contract;
  salaryStructureId: string;
  salaryStructure?: SalaryStructure;
  periodStartDate: string;
  periodEndDate: string;
  status: PayslipStatus;
  workedDays: number;
  expectedWorkingHours: number;
  actualWorkedHours: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  isEmailSent: boolean;
  emailSentAt?: string | null;
  lines?: PayslipLine[];
  warnings?: PayrollWarning[];
}

export interface Payrun {
  id: string;
  name: string;
  salaryStructureId: string;
  salaryStructure: SalaryStructure;
  periodStartDate: string;
  periodEndDate: string;
  status: PayrunStatus;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
  employeeCount: number;
  warningCount: number;
  computedAt?: string | null;
  validatedAt?: string | null;
  paidAt?: string | null;
  payslips?: Payslip[];
  warnings?: PayrollWarning[];
}

export interface DashboardMetrics {
  kpi: {
    totalNetSalaryPaid: number;
    totalGrossSalary: number;
    totalDeductions: number;
    payslipsGenerated: number;
    averageSalary: number;
    activeEmployees: number;
    approvedLeaveDays: number;
    attendanceHealthPercent: number;
  };
  charts: {
    departmentCost: Array<{
      id: string;
      department: string;
      code: string;
      headcount: number;
      totalCost: number;
      payslipCount: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      netSalary: number;
      grossSalary: number;
      count: number;
    }>;
    attendanceBreakdown: Array<{
      name: string;
      count: number;
      color: string;
    }>;
  };
  alerts: {
    unresolvedWarnings: PayrollWarning[];
    employeesMissingBank: Array<{ id: string; firstName: string; lastName: string; employeeCode: string }>;
    pendingLeavesCount: number;
    pendingLeaves: TimeOffRequest[];
  };
}
