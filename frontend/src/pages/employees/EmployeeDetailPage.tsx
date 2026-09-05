import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Clock,
  Calendar,
  Receipt,
  Building,
  Briefcase,
  Mail,
  Phone,
  Landmark,
  Layers,
  ArrowLeft,
  Edit2,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Employee, Department, JobPosition, WorkingSchedule } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SmartButton } from '../../components/ui/SmartButton';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'attendance' | 'timeoff' | 'payslips'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: employee, isLoading, error } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get<Employee>(`/employees/${id}`),
    enabled: !!id,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Department[]>('/departments'),
  });

  const { data: jobPositions = [] } = useQuery({
    queryKey: ['job-positions'],
    queryFn: () => api.get<JobPosition[]>('/job-positions'),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['working-schedules'],
    queryFn: () => api.get<WorkingSchedule[]>('/working-schedules'),
  });

  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phone: '',
    departmentId: '',
    jobPositionId: '',
    workingScheduleId: '',
    bankName: '',
    bankAccountNumber: '',
    bankIfscOrRouting: '',
    status: 'ACTIVE',
  });

  const openEditModal = () => {
    if (employee) {
      setEditFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        workEmail: employee.workEmail,
        phone: employee.phone || '',
        departmentId: employee.departmentId || '',
        jobPositionId: employee.jobPositionId || '',
        workingScheduleId: employee.workingScheduleId || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        bankIfscOrRouting: employee.bankIfscOrRouting || '',
        status: employee.status,
      });
      setIsEditModalOpen(true);
    }
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch<Employee>(`/employees/${id}`, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Profile Updated', 'Employee details saved successfully');
      setIsEditModalOpen(false);
    },
    onError: (err: any) => toast.error('Update failed', err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-ink-200 dark:bg-neutral-800 rounded w-1/4"></div>
        <div className="h-48 bg-surface-light dark:bg-surface-dark border border-ink-900 rounded-neo"></div>
      </div>
    );
  }

  if (!employee || error) {
    return (
      <div className="p-10 text-center space-y-4">
        <p className="text-sm font-bold text-ink-700 dark:text-ink-300">Employee profile not found</p>
        <Button onClick={() => navigate('/employees')} variant="secondary">
          Back to Directory
        </Button>
      </div>
    );
  }

  const activeContract = employee.contracts?.find((c) => c.status === 'RUNNING');

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb Nav */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/employees')}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant={employee.status === 'ACTIVE' ? 'active' : 'draft'}>
                {employee.status}
              </Badge>
            </div>
            <p className="text-xs font-mono text-ink-500 dark:text-ink-400 mt-0.5">
              Employee ID: {employee.employeeCode} • {employee.company}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          icon={<Edit2 className="w-4 h-4" />}
          onClick={openEditModal}
        >
          Edit Master Data
        </Button>
      </div>

      {/* Operational Smart Buttons Header (Canonical Hub) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SmartButton
          icon={<FileText className="w-4 h-4" />}
          count={employee._count?.contracts || employee.contracts?.length || 0}
          label="Contracts"
          isActive={activeTab === 'contracts'}
          onClick={() => setActiveTab('contracts')}
        />
        <SmartButton
          icon={<Clock className="w-4 h-4" />}
          count={employee._count?.attendances || employee.attendances?.length || 0}
          label="Attendance"
          isActive={activeTab === 'attendance'}
          onClick={() => setActiveTab('attendance')}
        />
        <SmartButton
          icon={<Calendar className="w-4 h-4" />}
          count={employee._count?.timeOffRequests || employee.timeOffRequests?.length || 0}
          label="Time Off"
          isActive={activeTab === 'timeoff'}
          onClick={() => setActiveTab('timeoff')}
        />
        <SmartButton
          icon={<Receipt className="w-4 h-4" />}
          count={employee._count?.payslips || employee.payslips?.length || 0}
          label="Payslips"
          isActive={activeTab === 'payslips'}
          onClick={() => setActiveTab('payslips')}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-ink-200 dark:border-neutral-800 flex gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-brand-700 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-ink-100'
          }`}
        >
          Overview & Identity
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'contracts'
              ? 'border-brand-700 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-ink-100'
          }`}
        >
          Contracts ({employee.contracts?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-brand-700 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-ink-100'
          }`}
        >
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('timeoff')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'timeoff'
              ? 'border-brand-700 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-ink-100'
          }`}
        >
          Time Off & Leaves
        </button>
        <button
          onClick={() => setActiveTab('payslips')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'payslips'
              ? 'border-brand-700 text-brand-700 dark:text-brand-400 dark:border-brand-400'
              : 'border-transparent text-ink-500 hover:text-ink-900 dark:hover:text-ink-100'
          }`}
        >
          Payslips ({employee.payslips?.length || 0})
        </button>
      </div>

      {/* Tab Content Panes */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work & Department Info */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 uppercase tracking-wider flex items-center gap-2 border-b border-ink-200 dark:border-neutral-800 pb-2.5">
              <Briefcase className="w-4 h-4 text-brand-700 dark:text-brand-400" /> Work & Department Information
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Department</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.department?.name || 'Unassigned'}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Job Position</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.jobPosition?.title || 'Unassigned'}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Manager</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : 'Direct Report to CEO'}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Work Location</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">{employee.workLocation}</p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Assigned Schedule</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5 font-mono">
                  {employee.workingSchedule?.name || 'Standard 40h'}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Hire Date</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {new Date(employee.hireDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          {/* Contact & Banking Info */}
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100 uppercase tracking-wider flex items-center gap-2 border-b border-ink-200 dark:border-neutral-800 pb-2.5">
              <Landmark className="w-4 h-4 text-brand-700 dark:text-brand-400" /> Contact & Payroll Account
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Work Email</span>
                <p className="font-mono font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.workEmail}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Phone Number</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">{employee.phone || 'N/A'}</p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Bank Name</span>
                <p className="font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.bankName || <span className="text-amber-600 font-semibold">Missing (Warning)</span>}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Account Number</span>
                <p className="font-mono font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.bankAccountNumber || <span className="text-amber-600 font-semibold">Missing (Warning)</span>}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Routing / IFSC</span>
                <p className="font-mono font-bold text-ink-900 dark:text-ink-100 mt-0.5">
                  {employee.bankIfscOrRouting || 'N/A'}
                </p>
              </div>

              <div>
                <span className="text-ink-500 dark:text-ink-400 font-medium">Active Running Wage</span>
                <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 text-sm">
                  {activeContract ? `$${activeContract.wage.toLocaleString()}/mo` : 'No active contract'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">
              Employment Contract History
            </h3>
            <Button size="sm" onClick={() => navigate('/contracts')}>
              Manage Contracts →
            </Button>
          </div>

          <DataTable
            columns={[
              {
                header: 'Reference',
                accessor: (c) => <span className="font-mono font-bold">{c.contractReference}</span>,
              },
              {
                header: 'Salary Structure',
                accessor: (c) => c.salaryStructure?.name || 'Standard',
              },
              {
                header: 'Monthly Wage',
                accessor: (c) => (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${c.wage.toLocaleString()}
                  </span>
                ),
              },
              {
                header: 'Period Validity',
                accessor: (c) => (
                  <span className="text-xs font-mono">
                    {new Date(c.startDate).toLocaleDateString()} →{' '}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString() : 'Ongoing (Running)'}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: (c) => (
                  <Badge variant={c.status === 'RUNNING' ? 'running' : 'draft'}>{c.status}</Badge>
                ),
              },
            ]}
            data={employee.contracts || []}
          />
        </Card>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">
              Recent Attendance Punches
            </h3>
            <Button size="sm" onClick={() => navigate('/attendance')}>
              Open Attendance Module →
            </Button>
          </div>

          <DataTable
            columns={[
              {
                header: 'Date',
                accessor: (a) => (
                  <span className="font-mono">{new Date(a.date).toLocaleDateString()}</span>
                ),
              },
              {
                header: 'Check In',
                accessor: (a) =>
                  a.checkIn ? new Date(a.checkIn).toLocaleTimeString() : <span className="text-ink-400">-</span>,
              },
              {
                header: 'Check Out',
                accessor: (a) =>
                  a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : <span className="text-amber-500 font-semibold">Missing</span>,
              },
              {
                header: 'Worked Hours',
                accessor: (a) => <span className="font-mono font-bold">{a.workedHours}h</span>,
              },
              {
                header: 'Status',
                accessor: (a) => <Badge variant={a.status === 'PRESENT' ? 'active' : 'warning'}>{a.status}</Badge>,
              },
            ]}
            data={employee.attendances || []}
          />
        </Card>
      )}

      {/* Time Off Tab */}
      {activeTab === 'timeoff' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Leave Allocations</h3>
            <DataTable
              columns={[
                {
                  header: 'Leave Type',
                  accessor: (al) => al.timeOffType?.name || 'PTO',
                },
                {
                  header: 'Allocated Amount',
                  accessor: (al) => <span className="font-mono font-bold">{al.allocatedAmount} {al.timeOffType?.unit}</span>,
                },
                {
                  header: 'Taken',
                  accessor: (al) => <span className="font-mono text-rose-600 font-bold">{al.takenAmount} {al.timeOffType?.unit}</span>,
                },
                {
                  header: 'Remaining Balance',
                  accessor: (al) => (
                    <span className="font-mono text-emerald-600 font-bold">
                      {al.allocatedAmount - al.takenAmount} {al.timeOffType?.unit}
                    </span>
                  ),
                },
                {
                  header: 'Status',
                  accessor: (al) => <Badge variant="active">{al.status}</Badge>,
                },
              ]}
              data={employee.timeOffAllocations || []}
            />
          </Card>

          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Submitted Leave Requests</h3>
            <DataTable
              columns={[
                {
                  header: 'Leave Type',
                  accessor: (r) => r.timeOffType?.name || 'Leave',
                },
                {
                  header: 'Dates',
                  accessor: (r) => (
                    <span className="font-mono text-xs">
                      {new Date(r.startDate).toLocaleDateString()} to {new Date(r.endDate).toLocaleDateString()}
                    </span>
                  ),
                },
                {
                  header: 'Duration',
                  accessor: (r) => <span className="font-mono font-bold">{r.duration} days</span>,
                },
                {
                  header: 'Reason',
                  accessor: (r) => r.reason || '-',
                },
                {
                  header: 'Status',
                  accessor: (r) => (
                    <Badge variant={r.status === 'APPROVED' ? 'active' : 'draft'}>{r.status}</Badge>
                  ),
                },
              ]}
              data={employee.timeOffRequests || []}
            />
          </Card>
        </div>
      )}

      {/* Payslips Tab */}
      {activeTab === 'payslips' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900 dark:text-ink-100">Generated Payslips</h3>
            <Button size="sm" onClick={() => navigate('/payroll')}>
              View Payruns →
            </Button>
          </div>

          <DataTable
            columns={[
              {
                header: 'Payrun Period',
                accessor: (p) => (
                  <span className="font-mono text-xs">
                    {new Date(p.periodStartDate).toLocaleDateString()} → {new Date(p.periodEndDate).toLocaleDateString()}
                  </span>
                ),
              },
              {
                header: 'Worked Days',
                accessor: (p) => <span className="font-mono">{p.workedDays} days</span>,
              },
              {
                header: 'Gross Salary',
                accessor: (p) => <span className="font-mono">${p.grossSalary.toLocaleString()}</span>,
              },
              {
                header: 'Total Deductions',
                accessor: (p) => <span className="font-mono text-rose-600">-${p.totalDeductions.toLocaleString()}</span>,
              },
              {
                header: 'Net Payable',
                accessor: (p) => (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ${p.netSalary.toLocaleString()}
                  </span>
                ),
              },
              {
                header: 'Status',
                accessor: (p) => (
                  <Badge variant={p.status === 'PAID' ? 'paid' : 'validated'}>{p.status}</Badge>
                ),
              },
              {
                header: 'Actions',
                accessor: (p) => (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => api.downloadPdf(`/payslips/${p.id}/pdf`, `payslip-${employee.employeeCode}.pdf`)}
                  >
                    PDF
                  </Button>
                ),
              },
            ]}
            data={employee.payslips || []}
          />
        </Card>
      )}

      {/* Edit Master Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Employee Master Data"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(editFormData);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={editFormData.firstName}
              onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={editFormData.lastName}
              onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Work Email"
              type="email"
              required
              value={editFormData.workEmail}
              onChange={(e) => setEditFormData({ ...editFormData, workEmail: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={editFormData.departmentId}
              onChange={(e) => setEditFormData({ ...editFormData, departmentId: e.target.value })}
              options={[
                { value: '', label: 'Unassigned' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Job Position"
              value={editFormData.jobPositionId}
              onChange={(e) => setEditFormData({ ...editFormData, jobPositionId: e.target.value })}
              options={[
                { value: '', label: 'Unassigned' },
                ...jobPositions.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
          </div>

          <Select
            label="Working Schedule"
            value={editFormData.workingScheduleId}
            onChange={(e) => setEditFormData({ ...editFormData, workingScheduleId: e.target.value })}
            options={[
              { value: '', label: 'Select Schedule...' },
              ...schedules.map((s) => ({ value: s.id, label: `${s.name} (${s.calculatedWeeklyHours}h/wk)` })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bank Name"
              placeholder="e.g. JPMorgan Chase"
              value={editFormData.bankName}
              onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
            />
            <Input
              label="Bank Account Number"
              placeholder="e.g. 9988112233"
              value={editFormData.bankAccountNumber}
              onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={updateMutation.isPending}>
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
