import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PeoplePay360 database...');

  // Clean existing tables in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.payrollWarning.deleteMany();
  await prisma.payslipLine.deleteMany();
  await prisma.payslip.deleteMany();
  await prisma.payrun.deleteMany();
  await prisma.salaryRule.deleteMany();
  await prisma.salaryStructure.deleteMany();
  await prisma.timeOffRequest.deleteMany();
  await prisma.timeOffAllocation.deleteMany();
  await prisma.timeOffType.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.jobPosition.deleteMany();
  await prisma.department.deleteMany();
  await prisma.workingScheduleDay.deleteMany();
  await prisma.workingSchedule.deleteMany();

  console.log('🧹 Cleaned existing data.');

  // ================= 1. DEPARTMENTS =================
  const deptEng = await prisma.department.create({
    data: { name: 'Engineering', code: 'ENG' },
  });
  const deptProd = await prisma.department.create({
    data: { name: 'Product & Design', code: 'PROD' },
  });
  const deptHR = await prisma.department.create({
    data: { name: 'Human Resources', code: 'HR' },
  });
  const deptSales = await prisma.department.create({
    data: { name: 'Sales & Marketing', code: 'SALES' },
  });
  const deptFin = await prisma.department.create({
    data: { name: 'Finance & Operations', code: 'FIN' },
  });

  console.log('✅ Created Departments');

  // ================= 2. JOB POSITIONS =================
  const posArch = await prisma.jobPosition.create({
    data: { title: 'Lead Software Architect', code: 'ENG-ARCH', departmentId: deptEng.id, expectedSalaryMin: 8000, expectedSalaryMax: 12000 },
  });
  const posSeniorDev = await prisma.jobPosition.create({
    data: { title: 'Senior Full-Stack Engineer', code: 'ENG-SR-DEV', departmentId: deptEng.id, expectedSalaryMin: 6000, expectedSalaryMax: 9000 },
  });
  const posDesigner = await prisma.jobPosition.create({
    data: { title: 'Lead Product Designer', code: 'PROD-DES', departmentId: deptProd.id, expectedSalaryMin: 5500, expectedSalaryMax: 8500 },
  });
  const posHROps = await prisma.jobPosition.create({
    data: { title: 'HR & Payroll Operations Lead', code: 'HR-OPS', departmentId: deptHR.id, expectedSalaryMin: 5000, expectedSalaryMax: 7500 },
  });
  const posSalesExec = await prisma.jobPosition.create({
    data: { title: 'Enterprise Account Executive', code: 'SALES-AE', departmentId: deptSales.id, expectedSalaryMin: 4500, expectedSalaryMax: 7000 },
  });
  const posFinAnalyst = await prisma.jobPosition.create({
    data: { title: 'Senior Financial Analyst', code: 'FIN-ANL', departmentId: deptFin.id, expectedSalaryMin: 5000, expectedSalaryMax: 8000 },
  });

  console.log('✅ Created Job Positions');

  // ================= 3. WORKING SCHEDULES =================
  const schedStd = await prisma.workingSchedule.create({
    data: {
      name: 'Standard 40h (Mon-Fri 09:00 - 18:00)',
      scheduleType: 'STANDARD_40H',
      calculatedWeeklyHours: 40.0,
      isActive: true,
      scheduleDays: {
        create: [
          { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 8.0 },
          { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 8.0 },
          { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 8.0 },
          { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 8.0 },
          { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 8.0 },
          { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '14:00', breakHours: 0.0, isWorkingDay: false, dayHours: 0.0 },
          { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '18:00', breakHours: 0.0, isWorkingDay: false, dayHours: 0.0 },
        ],
      },
    },
  });

  const schedFlex = await prisma.workingSchedule.create({
    data: {
      name: 'Flexible Tech 37.5h (Mon-Fri 09:30 - 18:00)',
      scheduleType: 'FLEXIBLE',
      calculatedWeeklyHours: 37.5,
      isActive: true,
      scheduleDays: {
        create: [
          { dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 7.5 },
          { dayOfWeek: 'TUESDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 7.5 },
          { dayOfWeek: 'WEDNESDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 7.5 },
          { dayOfWeek: 'THURSDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 7.5 },
          { dayOfWeek: 'FRIDAY', startTime: '09:30', endTime: '18:00', breakHours: 1.0, isWorkingDay: true, dayHours: 7.5 },
          { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '14:00', breakHours: 0.0, isWorkingDay: false, dayHours: 0.0 },
          { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '18:00', breakHours: 0.0, isWorkingDay: false, dayHours: 0.0 },
        ],
      },
    },
  });

  console.log('✅ Created Working Schedules');

  // ================= 4. SALARY STRUCTURES & RULES =================
  const structRegular = await prisma.salaryStructure.create({
    data: {
      name: 'Regular Full-time Salary',
      code: 'REGULAR_FT',
      description: 'Standard salary structure with Basic (50%), HRA (20%), Conveyance, Special Allowance, PF (12%), Professional Tax, and Income Tax brackets.',
      isActive: true,
      rules: {
        create: [
          {
            name: 'Basic Salary',
            code: 'BASIC',
            category: 'BASIC',
            sequence: 10,
            computationType: 'PERCENTAGE',
            percentage: 50.0,
            percentageOf: 'WAGE',
            isActive: true,
          },
          {
            name: 'House Rent Allowance (HRA)',
            code: 'HRA',
            category: 'ALLOWANCE',
            sequence: 20,
            computationType: 'PERCENTAGE',
            percentage: 20.0,
            percentageOf: 'BASIC',
            isActive: true,
          },
          {
            name: 'Conveyance Allowance',
            code: 'CONVEYANCE',
            category: 'ALLOWANCE',
            sequence: 30,
            computationType: 'FIXED',
            fixedAmount: 2000.0,
            isActive: true,
          },
          {
            name: 'Special Allowance',
            code: 'SPECIAL_ALLOWANCE',
            category: 'ALLOWANCE',
            sequence: 40,
            computationType: 'FORMULA',
            formula: 'WAGE - BASIC - HRA - CONVEYANCE',
            isActive: true,
          },
          {
            name: 'Gross Salary',
            code: 'GROSS',
            category: 'GROSS',
            sequence: 50,
            computationType: 'FORMULA',
            formula: 'BASIC + HRA + CONVEYANCE + SPECIAL_ALLOWANCE',
            isActive: true,
          },
          {
            name: 'Provident Fund (PF)',
            code: 'PF',
            category: 'DEDUCTION',
            sequence: 60,
            computationType: 'PERCENTAGE',
            percentage: 12.0,
            percentageOf: 'BASIC',
            isActive: true,
          },
          {
            name: 'Professional Tax (PT)',
            code: 'PROF_TAX',
            category: 'DEDUCTION',
            sequence: 70,
            computationType: 'FIXED',
            fixedAmount: 200.0,
            isActive: true,
          },
          {
            name: 'Income Tax (TDS)',
            code: 'INCOME_TAX',
            category: 'DEDUCTION',
            sequence: 80,
            computationType: 'FORMULA',
            formula: 'GROSS > 50000 ? (GROSS * 0.10) : (GROSS * 0.05)',
            isActive: true,
          },
          {
            name: 'Net Salary',
            code: 'NET',
            category: 'NET',
            sequence: 90,
            computationType: 'FORMULA',
            formula: 'GROSS - PF - PROF_TAX - INCOME_TAX',
            isActive: true,
          },
        ],
      },
    },
  });

  const structExecutive = await prisma.salaryStructure.create({
    data: {
      name: 'Executive & Leadership Salary',
      code: 'EXECUTIVE',
      description: 'Executive structure with performance allowance and higher tax bracket.',
      isActive: true,
      rules: {
        create: [
          {
            name: 'Basic Salary',
            code: 'BASIC',
            category: 'BASIC',
            sequence: 10,
            computationType: 'PERCENTAGE',
            percentage: 55.0,
            percentageOf: 'WAGE',
            isActive: true,
          },
          {
            name: 'Executive Housing Allowance',
            code: 'HRA',
            category: 'ALLOWANCE',
            sequence: 20,
            computationType: 'PERCENTAGE',
            percentage: 25.0,
            percentageOf: 'BASIC',
            isActive: true,
          },
          {
            name: 'Leadership Performance Stipend',
            code: 'PERF_STIPEND',
            category: 'ALLOWANCE',
            sequence: 30,
            computationType: 'FIXED',
            fixedAmount: 5000.0,
            isActive: true,
          },
          {
            name: 'Special Allowance',
            code: 'SPECIAL_ALLOWANCE',
            category: 'ALLOWANCE',
            sequence: 40,
            computationType: 'FORMULA',
            formula: 'WAGE - BASIC - HRA - PERF_STIPEND',
            isActive: true,
          },
          {
            name: 'Gross Salary',
            code: 'GROSS',
            category: 'GROSS',
            sequence: 50,
            computationType: 'FORMULA',
            formula: 'BASIC + HRA + PERF_STIPEND + SPECIAL_ALLOWANCE',
            isActive: true,
          },
          {
            name: 'Provident Fund (PF)',
            code: 'PF',
            category: 'DEDUCTION',
            sequence: 60,
            computationType: 'PERCENTAGE',
            percentage: 12.0,
            percentageOf: 'BASIC',
            isActive: true,
          },
          {
            name: 'Income Tax (Executive TDS)',
            code: 'INCOME_TAX',
            category: 'DEDUCTION',
            sequence: 70,
            computationType: 'FORMULA',
            formula: 'GROSS * 0.15',
            isActive: true,
          },
          {
            name: 'Net Salary',
            code: 'NET',
            category: 'NET',
            sequence: 80,
            computationType: 'FORMULA',
            formula: 'GROSS - PF - INCOME_TAX',
            isActive: true,
          },
        ],
      },
    },
  });

  console.log('✅ Created Salary Structures & Sequenced Rules');

  // ================= 5. TIME OFF TYPES =================
  const typePTO = await prisma.timeOffType.create({
    data: {
      name: 'Paid Time Off',
      code: 'PTO',
      unit: 'DAYS',
      requiresAllocation: true,
      approvalMode: 'BY_TIME_OFF_OFFICER',
      colorHex: '#714B67',
      isActive: true,
    },
  });

  const typeSick = await prisma.timeOffType.create({
    data: {
      name: 'Sick Leave',
      code: 'SICK',
      unit: 'DAYS',
      requiresAllocation: true,
      approvalMode: 'BY_TIME_OFF_OFFICER',
      colorHex: '#D97706',
      isActive: true,
    },
  });

  const typeUnpaid = await prisma.timeOffType.create({
    data: {
      name: 'Unpaid Leave',
      code: 'UNPAID',
      unit: 'DAYS',
      requiresAllocation: false,
      approvalMode: 'BY_MANAGER',
      colorHex: '#E11D48',
      isActive: true,
    },
  });

  console.log('✅ Created Time Off Types');

  // Password hashes
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // ================= 6. EMPLOYEES & USERS =================

  // 1. Admin
  const empAdmin = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0001',
      firstName: 'Antigravity',
      lastName: 'Admin',
      workEmail: 'admin@peoplepay360.com',
      phone: '+1 555-0100',
      departmentId: deptHR.id,
      jobPositionId: posHROps.id,
      workingScheduleId: schedStd.id,
      bankName: 'Silicon Valley Bank',
      bankAccountNumber: 'SVB-99881122',
      bankIfscOrRouting: 'SVBUS33',
      status: 'ACTIVE',
      hireDate: new Date('2023-01-01'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'admin@peoplepay360.com',
      passwordHash,
      role: 'ADMIN',
      employeeId: empAdmin.id,
    },
  });

  // 2. HR Payroll Manager
  const empPayrollMgr = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0002',
      firstName: 'Elena',
      lastName: 'Rostova',
      workEmail: 'payroll.manager@peoplepay360.com',
      phone: '+1 555-0102',
      departmentId: deptHR.id,
      jobPositionId: posHROps.id,
      workingScheduleId: schedStd.id,
      bankName: 'JPMorgan Chase',
      bankAccountNumber: 'JPM-44556677',
      bankIfscOrRouting: 'CHASUS33',
      status: 'ACTIVE',
      hireDate: new Date('2023-03-15'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'payroll.manager@peoplepay360.com',
      passwordHash,
      role: 'HR_PAYROLL_MANAGER',
      employeeId: empPayrollMgr.id,
    },
  });

  // 3. HR Payroll User
  const empPayrollUser = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0003',
      firstName: 'Jordan',
      lastName: 'Smyth',
      workEmail: 'payroll.user@peoplepay360.com',
      phone: '+1 555-0103',
      departmentId: deptHR.id,
      jobPositionId: posHROps.id,
      workingScheduleId: schedStd.id,
      bankName: 'Bank of America',
      bankAccountNumber: 'BOA-33221144',
      bankIfscOrRouting: 'BOFAUS3N',
      status: 'ACTIVE',
      hireDate: new Date('2023-06-01'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'payroll.user@peoplepay360.com',
      passwordHash,
      role: 'HR_PAYROLL_USER',
      employeeId: empPayrollUser.id,
    },
  });

  // 4. HR Manager
  const empHRMgr = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0004',
      firstName: 'Samantha',
      lastName: 'Reed',
      workEmail: 'hr.manager@peoplepay360.com',
      phone: '+1 555-0104',
      departmentId: deptHR.id,
      jobPositionId: posHROps.id,
      workingScheduleId: schedStd.id,
      bankName: 'Wells Fargo',
      bankAccountNumber: 'WF-55667788',
      bankIfscOrRouting: 'WFBIUS6S',
      status: 'ACTIVE',
      hireDate: new Date('2023-02-10'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'hr.manager@peoplepay360.com',
      passwordHash,
      role: 'HR_MANAGER',
      employeeId: empHRMgr.id,
    },
  });

  // 5. Alex Morgan (Lead Architect - demonstrates historical contract upgrade!)
  const empAlex = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0005',
      firstName: 'Alex',
      lastName: 'Morgan',
      workEmail: 'alex.morgan@peoplepay360.com',
      phone: '+1 555-0105',
      departmentId: deptEng.id,
      jobPositionId: posArch.id,
      workingScheduleId: schedFlex.id,
      bankName: 'Citigroup',
      bankAccountNumber: 'CITI-77889900',
      bankIfscOrRouting: 'CITIUS33',
      status: 'ACTIVE',
      hireDate: new Date('2024-01-01'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'alex.morgan@peoplepay360.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empAlex.id,
    },
  });

  // 6. Sarah Chen (Senior Dev)
  const empSarah = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0006',
      firstName: 'Sarah',
      lastName: 'Chen',
      workEmail: 'sarah.chen@peoplepay360.com',
      phone: '+1 555-0106',
      departmentId: deptEng.id,
      jobPositionId: posSeniorDev.id,
      workingScheduleId: schedFlex.id,
      bankName: 'PNC Bank',
      bankAccountNumber: 'PNC-11223344',
      bankIfscOrRouting: 'PNCUS33',
      status: 'ACTIVE',
      hireDate: new Date('2024-03-01'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'sarah.chen@peoplepay360.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empSarah.id,
    },
  });

  // 7. Marcus Vance (Designer)
  const empMarcus = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0007',
      firstName: 'Marcus',
      lastName: 'Vance',
      workEmail: 'marcus.vance@peoplepay360.com',
      phone: '+1 555-0107',
      departmentId: deptProd.id,
      jobPositionId: posDesigner.id,
      workingScheduleId: schedStd.id,
      bankName: 'US Bank',
      bankAccountNumber: 'USB-99001122',
      bankIfscOrRouting: 'USBKUS44',
      status: 'ACTIVE',
      hireDate: new Date('2024-02-15'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'marcus.vance@peoplepay360.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empMarcus.id,
    },
  });

  // 8. Priya Patel (Executive / Finance)
  const empPriya = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0008',
      firstName: 'Priya',
      lastName: 'Patel',
      workEmail: 'priya.patel@peoplepay360.com',
      phone: '+1 555-0108',
      departmentId: deptFin.id,
      jobPositionId: posFinAnalyst.id,
      workingScheduleId: schedStd.id,
      bankName: 'HSBC Bank',
      bankAccountNumber: 'HSBC-33445566',
      bankIfscOrRouting: 'HSBCUS33',
      status: 'ACTIVE',
      hireDate: new Date('2023-11-01'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'priya.patel@peoplepay360.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empPriya.id,
    },
  });

  // 9. David Kim (Sales Exec - deliberately missing bank details for validation warning test)
  const empDavid = await prisma.employee.create({
    data: {
      employeeCode: 'EMP-0009',
      firstName: 'David',
      lastName: 'Kim',
      workEmail: 'david.kim@peoplepay360.com',
      phone: '+1 555-0109',
      departmentId: deptSales.id,
      jobPositionId: posSalesExec.id,
      workingScheduleId: schedStd.id,
      bankName: null, // Deliberately null for warning demo
      bankAccountNumber: null,
      bankIfscOrRouting: null,
      status: 'ACTIVE',
      hireDate: new Date('2024-05-01'),
    },
  });
  await prisma.user.create({
    data: {
      email: 'david.kim@peoplepay360.com',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: empDavid.id,
    },
  });

  console.log('✅ Created Employees & User Accounts');

  // ================= 7. CONTRACTS & HISTORICAL RECORDS =================
  // Alex Morgan: Contract 1 (Historical: Jan 1 2024 -> Jun 30 2024, $65,000)
  await prisma.contract.create({
    data: {
      contractReference: 'CTR-0001',
      employeeId: empAlex.id,
      departmentId: deptEng.id,
      jobPositionId: posArch.id,
      workingScheduleId: schedFlex.id,
      salaryStructureId: structRegular.id,
      wage: 65000.0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      status: 'EXPIRED',
      contractType: 'FULL_TIME',
      notes: 'Initial probationary contract.',
    },
  });

  // Alex Morgan: Contract 2 (Active Running: Jul 1 2024 -> ongoing, $85,000)
  await prisma.contract.create({
    data: {
      contractReference: 'CTR-0002',
      employeeId: empAlex.id,
      departmentId: deptEng.id,
      jobPositionId: posArch.id,
      workingScheduleId: schedFlex.id,
      salaryStructureId: structRegular.id,
      wage: 85000.0,
      startDate: new Date('2024-07-01'),
      endDate: null,
      status: 'RUNNING',
      contractType: 'FULL_TIME',
      notes: 'Promoted to Lead Architect contract with enhanced wage.',
    },
  });

  // Sarah Chen Contract
  await prisma.contract.create({
    data: {
      contractReference: 'CTR-0003',
      employeeId: empSarah.id,
      departmentId: deptEng.id,
      jobPositionId: posSeniorDev.id,
      workingScheduleId: schedFlex.id,
      salaryStructureId: structRegular.id,
      wage: 72000.0,
      startDate: new Date('2024-03-01'),
      endDate: null,
      status: 'RUNNING',
      contractType: 'FULL_TIME',
    },
  });

  // Marcus Vance Contract
  await prisma.contract.create({
    data: {
      contractReference: 'CTR-0004',
      employeeId: empMarcus.id,
      departmentId: deptProd.id,
      jobPositionId: posDesigner.id,
      workingScheduleId: schedStd.id,
      salaryStructureId: structRegular.id,
      wage: 68000.0,
      startDate: new Date('2024-02-15'),
      endDate: null,
      status: 'RUNNING',
      contractType: 'FULL_TIME',
    },
  });

  // Priya Patel (Executive Structure)
  await prisma.contract.create({
    data: {
      contractReference: 'CTR-0005',
      employeeId: empPriya.id,
      departmentId: deptFin.id,
      jobPositionId: posFinAnalyst.id,
      workingScheduleId: schedStd.id,
      salaryStructureId: structExecutive.id,
      wage: 95000.0,
      startDate: new Date('2023-11-01'),
      endDate: null,
      status: 'RUNNING',
      contractType: 'FULL_TIME',
    },
  });

  // David Kim Contract
  await prisma.contract.create({
    data: {
      contractReference: 'CTR-0006',
      employeeId: empDavid.id,
      departmentId: deptSales.id,
      jobPositionId: posSalesExec.id,
      workingScheduleId: schedStd.id,
      salaryStructureId: structRegular.id,
      wage: 55000.0,
      startDate: new Date('2024-05-01'),
      endDate: null,
      status: 'RUNNING',
      contractType: 'FULL_TIME',
    },
  });

  console.log('✅ Created Historical & Running Contracts');

  // ================= 8. TIME OFF ALLOCATIONS & REQUESTS =================
  // Allocate 20 PTO days to Alex Morgan
  await prisma.timeOffAllocation.create({
    data: {
      employeeId: empAlex.id,
      timeOffTypeId: typePTO.id,
      allocatedAmount: 20.0,
      takenAmount: 3.0,
      status: 'APPROVED',
      validityStartDate: new Date('2026-01-01'),
      validityEndDate: new Date('2026-12-31'),
      approvedById: empAdmin.id,
      approvedAt: new Date('2026-01-01'),
    },
  });

  // Approved leave request for Alex Morgan (3 days)
  await prisma.timeOffRequest.create({
    data: {
      employeeId: empAlex.id,
      timeOffTypeId: typePTO.id,
      startDate: new Date('2026-02-10'),
      endDate: new Date('2026-02-12'),
      duration: 3.0,
      status: 'APPROVED',
      reason: 'Personal time off / Family event',
      approvedById: empAdmin.id,
      approvedAt: new Date('2026-02-08'),
    },
  });

  // Allocate 20 PTO days to Sarah Chen
  await prisma.timeOffAllocation.create({
    data: {
      employeeId: empSarah.id,
      timeOffTypeId: typePTO.id,
      allocatedAmount: 20.0,
      takenAmount: 0.0,
      status: 'APPROVED',
      validityStartDate: new Date('2026-01-01'),
      validityEndDate: new Date('2026-12-31'),
      approvedById: empAdmin.id,
      approvedAt: new Date('2026-01-01'),
    },
  });

  // Pending submitted leave request for Sarah Chen
  await prisma.timeOffRequest.create({
    data: {
      employeeId: empSarah.id,
      timeOffTypeId: typePTO.id,
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-04-17'),
      duration: 3.0,
      status: 'SUBMITTED',
      reason: 'Spring vacation trip',
    },
  });

  console.log('✅ Created Leave Allocations & Requests');

  // ================= 9. ATTENDANCE LOGS =================
  const today = new Date();
  const allEmployees = [empAlex, empSarah, empMarcus, empPriya, empDavid];

  for (let d = 1; d <= 5; d++) {
    const logDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - d);
    logDate.setHours(0, 0, 0, 0);

    for (const emp of allEmployees) {
      const checkIn = new Date(logDate);
      checkIn.setHours(9, Math.floor(Math.random() * 15), 0);
      const checkOut = new Date(logDate);
      checkOut.setHours(18, Math.floor(Math.random() * 15), 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: logDate,
          checkIn,
          checkOut,
          workedHours: 8.0,
          status: 'PRESENT',
        },
      });
    }
  }

  console.log('✅ Created Attendance Logs');

  // ================= 10. HISTORICAL PAID PAYRUN & PAYSLIPS =================
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const prevPayrun = await prisma.payrun.create({
    data: {
      name: `Payrun - ${prevMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' })} (Regular FT)`,
      salaryStructureId: structRegular.id,
      periodStartDate: prevMonthStart,
      periodEndDate: prevMonthEnd,
      status: 'PAID',
      totalGross: 280000.0,
      totalDeduction: 45000.0,
      totalNet: 235000.0,
      employeeCount: 4,
      warningCount: 0,
      computedAt: prevMonthEnd,
      validatedAt: prevMonthEnd,
      paidAt: prevMonthEnd,
      createdById: empAdmin.id,
    },
  });

  console.log('✨ Seed completed successfully! All entities ready for demo.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
