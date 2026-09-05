import { PrismaClient } from '@prisma/client';

export interface DashboardFilter {
  periodStartDate?: string;
  periodEndDate?: string;
  departmentId?: string;
}

export class DashboardService {
  constructor(private prisma: PrismaClient) {}

  async getPayrollMetrics(filters?: DashboardFilter) {
    const payslipWhere: any = {};
    if (filters?.periodStartDate || filters?.periodEndDate) {
      payslipWhere.periodStartDate = {};
      if (filters.periodStartDate) payslipWhere.periodStartDate.gte = new Date(filters.periodStartDate);
      if (filters.periodEndDate) payslipWhere.periodStartDate.lte = new Date(filters.periodEndDate);
    }
    if (filters?.departmentId) {
      payslipWhere.employee = { departmentId: filters.departmentId };
    }

    // Aggregate paid payslips
    const paidPayslips = await this.prisma.payslip.findMany({
      where: {
        ...payslipWhere,
        status: { in: ['PAID', 'VERIFIED', 'COMPUTED'] },
      },
      include: {
        employee: {
          select: { departmentId: true, department: { select: { name: true } } },
        },
      },
    });

    const totalNetSalaryPaid = paidPayslips.reduce((acc, p) => acc + p.netSalary, 0);
    const totalGrossSalary = paidPayslips.reduce((acc, p) => acc + p.grossSalary, 0);
    const totalDeductions = paidPayslips.reduce((acc, p) => acc + p.totalDeductions, 0);
    const payslipsCount = paidPayslips.length;
    const avgSalary = payslipsCount > 0 ? totalNetSalaryPaid / payslipsCount : 0;

    // Total active employees
    const activeEmployeesCount = await this.prisma.employee.count({
      where: {
        status: 'ACTIVE',
        departmentId: filters?.departmentId || undefined,
      },
    });

    // Approved time off requests count & total duration
    const approvedLeave = await this.prisma.timeOffRequest.findMany({
      where: {
        status: 'APPROVED',
        employee: filters?.departmentId ? { departmentId: filters.departmentId } : undefined,
      },
    });
    const approvedLeaveDays = approvedLeave.reduce((acc, r) => acc + r.duration, 0);

    // Attendance health metrics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        employee: filters?.departmentId ? { departmentId: filters.departmentId } : undefined,
      },
    });

    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const lateCount = attendances.filter((a) => a.status === 'LATE').length;
    const overtimeCount = attendances.filter((a) => a.status === 'OVERTIME').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const totalAttendanceLogs = attendances.length;
    const attendanceHealthPercent =
      totalAttendanceLogs > 0
        ? Math.round(((presentCount + overtimeCount + lateCount) / totalAttendanceLogs) * 100)
        : 96;

    // Department Salary Cost Breakdown
    const departments = await this.prisma.department.findMany({
      include: {
        employees: {
          select: { id: true },
        },
      },
    });

    const departmentCostData = departments.map((dept) => {
      const deptPayslips = paidPayslips.filter((p) => p.employee?.departmentId === dept.id);
      const totalCost = deptPayslips.reduce((acc, p) => acc + p.grossSalary, 0);
      return {
        id: dept.id,
        department: dept.name,
        code: dept.code,
        headcount: dept.employees.length,
        totalCost: Number(totalCost.toFixed(2)),
        payslipCount: deptPayslips.length,
      };
    });

    // Monthly Salary Trend (last 6 months dynamic)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrendMap: Record<string, { month: string; netSalary: number; grossSalary: number; count: number }> = {};

    // Initialize past 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyTrendMap[key] = { month: key, netSalary: 0, grossSalary: 0, count: 0 };
    }

    const allHistoricalPayslips = await this.prisma.payslip.findMany({
      where: {
        employee: filters?.departmentId ? { departmentId: filters.departmentId } : undefined,
      },
    });

    for (const p of allHistoricalPayslips) {
      const d = new Date(p.periodStartDate);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyTrendMap[key]) {
        monthlyTrendMap[key].netSalary += p.netSalary;
        monthlyTrendMap[key].grossSalary += p.grossSalary;
        monthlyTrendMap[key].count += 1;
      }
    }

    const monthlyTrend = Object.values(monthlyTrendMap);

    // Operational Alerts
    const unresolvedWarnings = await this.prisma.payrollWarning.findMany({
      where: { isResolved: false },
      include: { employee: { select: { firstName: true, lastName: true } } },
      take: 5,
    });

    const employeesMissingBank = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        OR: [{ bankAccountNumber: null }, { bankAccountNumber: '' }],
      },
      select: { id: true, firstName: true, lastName: true, employeeCode: true },
    });

    const pendingLeaves = await this.prisma.timeOffRequest.findMany({
      where: { status: 'SUBMITTED' },
      include: {
        employee: { select: { firstName: true, lastName: true } },
        timeOffType: { select: { name: true } },
      },
      take: 5,
    });

    return {
      kpi: {
        totalNetSalaryPaid: Number(totalNetSalaryPaid.toFixed(2)),
        totalGrossSalary: Number(totalGrossSalary.toFixed(2)),
        totalDeductions: Number(totalDeductions.toFixed(2)),
        payslipsGenerated: payslipsCount,
        averageSalary: Number(avgSalary.toFixed(2)),
        activeEmployees: activeEmployeesCount,
        approvedLeaveDays,
        attendanceHealthPercent,
      },
      charts: {
        departmentCost: departmentCostData,
        monthlyTrend,
        attendanceBreakdown: [
          { name: 'Present', count: presentCount, color: '#059669' },
          { name: 'Late', count: lateCount, color: '#D97706' },
          { name: 'Overtime', count: overtimeCount, color: '#714B67' },
          { name: 'Absent', count: absentCount, color: '#E11D48' },
        ],
      },
      alerts: {
        unresolvedWarnings,
        employeesMissingBank,
        pendingLeavesCount: pendingLeaves.length,
        pendingLeaves,
      },
    };
  }
}
