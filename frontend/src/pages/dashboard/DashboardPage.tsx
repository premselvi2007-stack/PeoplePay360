import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Receipt,
  Users,
  CalendarCheck,
  Activity,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '../../lib/api';
import { DashboardMetrics, Department } from '../../lib/types';
import { StatCard } from '../../components/ui/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { useTheme } from '../../context/ThemeContext';
import { NavLink } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { theme } = useTheme();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [periodRange, setPeriodRange] = useState<'all' | '30d' | '90d' | 'year'>('all');

  // Fetch departments for filter dropdown
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Department[]>('/departments'),
  });

  // Calculate dates based on periodRange
  const getFilterDates = () => {
    if (periodRange === 'all') return {};
    const now = new Date();
    const start = new Date();
    if (periodRange === '30d') start.setDate(now.getDate() - 30);
    if (periodRange === '90d') start.setDate(now.getDate() - 90);
    if (periodRange === 'year') start.setFullYear(now.getFullYear() - 1);
    return {
      periodStartDate: start.toISOString(),
      periodEndDate: now.toISOString(),
    };
  };

  const {
    data: metrics,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['dashboard-metrics', selectedDepartment, periodRange],
    queryFn: () =>
      api.get<DashboardMetrics>('/dashboard/payroll', {
        departmentId: selectedDepartment || undefined,
        ...getFilterDates(),
      }),
  });

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#27272A' : '#E4E4E7';
  const textColor = isDark ? '#A1A1AA' : '#71717A';

  return (
    <div className="space-y-6">
      {/* Page Header & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
            Payroll & HR Operations Dashboard
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Real-time aggregate data across payroll runs, contracts, attendance, and leave tracking
          </p>
        </div>

        {/* Live Filter Bar */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="w-40 sm:w-48">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-surface-light text-ink-900 border border-ink-900 dark:border-neutral-700 rounded-neo px-2.5 py-1.5 text-xs font-semibold dark:bg-surface-dark dark:text-ink-100 shadow-neo-sm"
            >
              <option value="">All Departments</option>
              {departments?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-32">
            <select
              value={periodRange}
              onChange={(e: any) => setPeriodRange(e.target.value)}
              className="w-full bg-surface-light text-ink-900 border border-ink-900 dark:border-neutral-700 rounded-neo px-2.5 py-1.5 text-xs font-semibold dark:bg-surface-dark dark:text-ink-100 shadow-neo-sm"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">Past Year</option>
            </select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            isLoading={isRefetching}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            title="Refresh Live Data"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Net Paid"
          value={`$${(metrics?.kpi.totalNetSalaryPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
          subtitle="Processed payroll net total"
          icon={<DollarSign className="w-5 h-5" />}
          className="border-brand-700/40"
        />

        <StatCard
          title="Payslips Generated"
          value={metrics?.kpi.payslipsGenerated || 0}
          subtitle="Total payslip statements"
          icon={<Receipt className="w-5 h-5" />}
        />

        <StatCard
          title="Average Salary"
          value={`$${Math.round(metrics?.kpi.averageSalary || 0).toLocaleString()}`}
          subtitle="Average net per payslip"
          icon={<Building className="w-5 h-5" />}
        />

        <StatCard
          title="Approved Time Off"
          value={`${metrics?.kpi.approvedLeaveDays || 0} Days`}
          subtitle="Leave taken & approved"
          icon={<CalendarCheck className="w-5 h-5" />}
        />

        <StatCard
          title="Attendance Health"
          value={`${metrics?.kpi.attendanceHealthPercent || 96}%`}
          subtitle="On-time & present rate"
          icon={<Activity className="w-5 h-5" />}
          trend={{ value: 'Normal Health', isPositive: true }}
        />
      </div>

      {/* Primary Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payroll Expenditure Trend */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">
                Monthly Payroll Expenditure Trend
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Gross earnings vs Net disbursements over recent periods
              </p>
            </div>
            <Badge variant="brand">Live Data</Badge>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics?.charts.monthlyTrend || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#714B67" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#714B67" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="month" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={textColor}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#181B23' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#09090B',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, '']}
                />
                <Area
                  type="monotone"
                  dataKey="grossSalary"
                  name="Gross Total"
                  stroke="#059669"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#grossGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="netSalary"
                  name="Net Disbursed"
                  stroke="#714B67"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#netGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Attendance Breakdown Gauge */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">
                Attendance Distribution
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Logged work statuses (30-day window)
              </p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.charts.attendanceBreakdown || []}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {metrics?.charts.attendanceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#181B23' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#09090B',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs text-ink-700 dark:text-ink-300 font-medium">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Secondary Row: Department Salary Costs & Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Salary Cost Breakdown */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">
                Salary Cost by Department
              </h3>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                Total salary expenditure and headcount per department
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.charts.departmentCost || []}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="department" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={textColor}
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#181B23' : '#FFFFFF',
                    borderColor: isDark ? '#27272A' : '#09090B',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Cost']}
                />
                <Bar dataKey="totalCost" fill="#714B67" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Operational Alerts Widget */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Operational Attention
              </h3>
              <Badge variant="warning" size="sm">
                {(metrics?.alerts.unresolvedWarnings.length || 0) +
                  (metrics?.alerts.employeesMissingBank.length || 0) +
                  (metrics?.alerts.pendingLeavesCount || 0)}{' '}
                Items
              </Badge>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              {/* Missing Bank Details Warning */}
              {metrics?.alerts.employeesMissingBank && metrics.alerts.employeesMissingBank.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-neo">
                  <p className="font-bold text-amber-900 dark:text-amber-300">
                    Missing Bank Information ({metrics.alerts.employeesMissingBank.length})
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                    {metrics.alerts.employeesMissingBank.map((e) => `${e.firstName} ${e.lastName}`).join(', ')}
                  </p>
                </div>
              )}

              {/* Pending Leave Requests */}
              {metrics?.alerts.pendingLeaves && metrics.alerts.pendingLeaves.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 rounded-neo">
                  <p className="font-bold text-blue-900 dark:text-blue-300">
                    Pending Leave Requests ({metrics.alerts.pendingLeaves.length})
                  </p>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
                    Awaiting manager review in Time Off module
                  </p>
                </div>
              )}

              {/* Payroll Warnings */}
              {metrics?.alerts.unresolvedWarnings && metrics.alerts.unresolvedWarnings.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-neo">
                  <p className="font-bold text-rose-900 dark:text-rose-300">
                    Unresolved Payroll Warnings ({metrics.alerts.unresolvedWarnings.length})
                  </p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                    Review warnings before finalizing batches
                  </p>
                </div>
              )}

              {(!metrics?.alerts.employeesMissingBank.length &&
                !metrics?.alerts.pendingLeaves.length &&
                !metrics?.alerts.unresolvedWarnings.length) && (
                <div className="text-center py-6 text-ink-500 dark:text-ink-400">
                  <p className="font-medium">All operations running clean!</p>
                  <p className="text-[11px] mt-1">No blocking alerts or missing compliance records.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-ink-200 dark:border-neutral-800 mt-4">
            <NavLink to="/payroll">
              <Button size="sm" variant="secondary" className="w-full">
                Go to Payroll Batches →
              </Button>
            </NavLink>
          </div>
        </Card>
      </div>
    </div>
  );
};
