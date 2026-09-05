import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar, Download, Filter, FileSpreadsheet } from 'lucide-react';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { DataTable } from '../../components/ui/DataTable';

interface PayrollReportRow {
  id: string;
  payrunId: string;
  name: string;
  period: string;
  structure: string;
  status: string;
  employeeCount: number;
  totalGross: number;
  totalDeduction: number;
  totalNet: number;
  paidAt?: string | null;
}

interface AttendanceReportRow {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    department?: { name: string };
  };
  totalDays: number;
  present: number;
  late: number;
  overtime: number;
  totalWorkedHours: number;
}

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'attendance'>('payroll');

  // Payroll filter state
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
  );

  // Attendance filter state
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const { data: payrollReport = [], isLoading: isPayrollLoading } = useQuery({
    queryKey: ['reports-payroll', startDate, endDate],
    queryFn: async () => {
      const list = await api.get<any[]>('/reports/payroll', {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return list.map((item) => ({ ...item, id: item.payrunId }));
    },
    enabled: activeTab === 'payroll',
  });

  const { data: attendanceReport = [], isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['reports-attendance', month],
    queryFn: async () => {
      const list = await api.get<any[]>('/reports/attendance', {
        month: month ? `${month}-01` : undefined,
      });
      return list.map((item) => ({ ...item, id: item.employee.id }));
    },
    enabled: activeTab === 'attendance',
  });

  // Calculate payroll aggregates
  const totalGrossSum = payrollReport.reduce((acc, row) => acc + (row.totalGross || 0), 0);
  const totalDeductionSum = payrollReport.reduce((acc, row) => acc + (row.totalDeduction || 0), 0);
  const totalNetSum = payrollReport.reduce((acc, row) => acc + (row.totalNet || 0), 0);

  const exportPayrollCsv = () => {
    const headers = ['Batch Name', 'Period', 'Structure', 'Status', 'Employees', 'Gross', 'Deductions', 'Net'];
    const rows = payrollReport.map((r) => [
      `"${r.name}"`,
      `"${r.period}"`,
      `"${r.structure}"`,
      r.status,
      r.employeeCount,
      r.totalGross,
      r.totalDeduction,
      r.totalNet,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `payroll-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendanceCsv = () => {
    const headers = ['Employee Code', 'Name', 'Department', 'Total Days', 'Present', 'Late', 'Overtime', 'Worked Hours'];
    const rows = attendanceReport.map((r) => [
      r.employee.employeeCode,
      `"${r.employee.firstName} ${r.employee.lastName}"`,
      `"${r.employee.department?.name || 'Unassigned'}"`,
      r.totalDays,
      r.present,
      r.late,
      r.overtime,
      r.totalWorkedHours.toFixed(2),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance-report-${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-700 dark:text-brand-400" />
            Operational & Financial Reports
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Analyze workforce attendance metrics, payroll costs, tax liabilities, and statutory deductions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'payroll' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('payroll')}
          >
            Payroll Summary
          </Button>
          <Button
            variant={activeTab === 'attendance' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('attendance')}
          >
            Attendance Logs
          </Button>
        </div>
      </div>

      {/* Tab 1: Payroll Summary */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <Card className="p-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-44">
                  <Input
                    label="From Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="w-44">
                  <Input
                    label="To Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={exportPayrollCsv} disabled={payrollReport.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </Card>

          {/* Aggregates Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Total Gross Disbursed
              </span>
              <p className="text-2xl font-black text-ink-900 dark:text-ink-100 mt-1">
                ${totalGrossSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-4 border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Total Statutory Deductions
              </span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                ${totalDeductionSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-4 border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Total Net Payout
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ${totalNetSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </Card>
          </div>

          {/* Report Table */}
          <Card className="p-4">
            <DataTable<PayrollReportRow>
              data={payrollReport}
              isLoading={isPayrollLoading}
              emptyMessage="No payroll runs found in the selected date range."
              columns={[
                {
                  header: 'Batch',
                  accessor: (r) => (
                    <div>
                      <strong className="text-ink-900 dark:text-ink-100">{r.name}</strong>
                      <div className="text-[11px] text-ink-500">{r.period}</div>
                    </div>
                  ),
                },
                {
                  header: 'Structure',
                  accessor: (r) => <span className="text-xs font-mono">{r.structure}</span>,
                },
                {
                  header: 'Status',
                  accessor: (r) => (
                    <Badge variant={r.status === 'PAID' ? 'paid' : r.status === 'VALIDATED' ? 'validated' : 'neutral'}>
                      {r.status}
                    </Badge>
                  ),
                },
                {
                  header: 'Employees',
                  accessor: (r) => <span className="text-xs font-bold">{r.employeeCount}</span>,
                },
                {
                  header: 'Gross Total',
                  accessor: (r) => (
                    <span className="text-xs font-bold font-mono">
                      ${r.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Deductions',
                  accessor: (r) => (
                    <span className="text-xs font-bold font-mono text-rose-600">
                      -${r.totalDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Net Payout',
                  accessor: (r) => (
                    <span className="text-xs font-extrabold font-mono text-emerald-600">
                      ${r.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}

      {/* Tab 2: Attendance Report */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="w-56">
                <Input
                  label="Select Month"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>

              <Button variant="secondary" size="sm" onClick={exportAttendanceCsv} disabled={attendanceReport.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                Export CSV
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <DataTable<AttendanceReportRow>
              data={attendanceReport}
              isLoading={isAttendanceLoading}
              emptyMessage="No attendance records recorded for this month."
              columns={[
                {
                  header: 'Employee',
                  accessor: (r) => (
                    <div>
                      <strong className="text-ink-900 dark:text-ink-100">
                        {r.employee.firstName} {r.employee.lastName}
                      </strong>
                      <div className="text-[11px] text-ink-500">{r.employee.employeeCode}</div>
                    </div>
                  ),
                },
                {
                  header: 'Department',
                  accessor: (r) => (
                    <span className="text-xs text-ink-700 dark:text-ink-300">
                      {r.employee.department?.name || 'Unassigned'}
                    </span>
                  ),
                },
                {
                  header: 'Total Days',
                  accessor: (r) => <span className="text-xs font-bold font-mono">{r.totalDays}</span>,
                },
                {
                  header: 'Present',
                  accessor: (r) => (
                    <Badge variant="active" size="sm">
                      {r.present}
                    </Badge>
                  ),
                },
                {
                  header: 'Late',
                  accessor: (r) => (
                    <Badge variant="warning" size="sm">
                      {r.late}
                    </Badge>
                  ),
                },
                {
                  header: 'Overtime Logs',
                  accessor: (r) => (
                    <Badge variant="brand" size="sm">
                      {r.overtime}
                    </Badge>
                  ),
                },
                {
                  header: 'Total Hours Worked',
                  accessor: (r) => (
                    <span className="text-xs font-extrabold font-mono text-ink-900 dark:text-ink-100">
                      {r.totalWorkedHours.toFixed(1)} hrs
                    </span>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
