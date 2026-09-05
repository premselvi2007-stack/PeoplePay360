import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  Mail,
  Building,
  Briefcase,
  Calendar,
  FileText,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Employee, Department, JobPosition, WorkingSchedule } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';

export const EmployeesListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form state for creating new employee
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phone: '',
    departmentId: '',
    jobPositionId: '',
    workingScheduleId: '',
    bankName: '',
    bankAccountNumber: '',
    status: 'ACTIVE',
  });

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees', searchTerm, selectedDept],
    queryFn: () =>
      api.get<Employee[]>('/employees', {
        search: searchTerm || undefined,
        departmentId: selectedDept || undefined,
      }),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Department[]>('/departments'),
  });

  const { data: jobPositions = [] } = useQuery({
    queryKey: ['job-positions', formData.departmentId],
    queryFn: () => api.get<JobPosition[]>('/job-positions', { departmentId: formData.departmentId || undefined }),
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['working-schedules'],
    queryFn: () => api.get<WorkingSchedule[]>('/working-schedules'),
  });

  const createMutation = useMutation({
    mutationFn: (newEmp: any) => api.post<Employee>('/employees', newEmp),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee Created', `${created.firstName} ${created.lastName} has been added`);
      setIsNewModalOpen(false);
      navigate(`/employees/${created.id}`);
    },
    onError: (err: any) => {
      toast.error('Failed to create employee', err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Code',
      accessor: (row: Employee) => <span className="font-mono font-bold">{row.employeeCode}</span>,
    },
    {
      header: 'Employee Name',
      accessor: (row: Employee) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 font-black text-xs flex items-center justify-center border border-brand-300 dark:border-brand-800">
            {row.firstName[0]}
            {row.lastName[0]}
          </div>
          <div>
            <div className="font-bold text-ink-900 dark:text-ink-100">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-ink-500 dark:text-ink-400">{row.workEmail}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: (row: Employee) => row.department?.name || '-',
    },
    {
      header: 'Job Position',
      accessor: (row: Employee) => row.jobPosition?.title || '-',
    },
    {
      header: 'Schedule',
      accessor: (row: Employee) => (
        <span className="text-xs text-ink-600 dark:text-ink-300 font-mono">
          {row.workingSchedule?.name || 'Standard 40h'}
        </span>
      ),
    },
    {
      header: 'Running Contract',
      accessor: (row: Employee) => {
        const active = row.contracts?.[0];
        return active ? (
          <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
            {active.contractReference} (${active.wage.toLocaleString()})
          </span>
        ) : (
          <Badge variant="warning" size="sm">No Contract</Badge>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: Employee) => (
        <Badge variant={row.status === 'ACTIVE' ? 'active' : 'draft'}>{row.status}</Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header & View Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
            Employee Directory
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Central operational hub for workforce master data, contracts, attendance, and leave profiles
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Kanban / List Toggle */}
          <div className="flex items-center bg-surface-light dark:bg-surface-dark border border-ink-900 dark:border-neutral-700 rounded-neo p-1 shadow-neo-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-neutral-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-700 text-white'
                  : 'text-ink-700 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-neutral-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsNewModalOpen(true)}
          >
            New Employee
          </Button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightElement={<Search className="w-4 h-4 text-ink-400" />}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            options={[
              { value: '', label: 'All Departments' },
              ...departments.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>
      </div>

      {/* Main View Mode */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((emp) => {
            const activeContract = emp.contracts?.[0];
            return (
              <Card
                key={emp.id}
                hoverable
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 font-black text-sm flex items-center justify-center border-2 border-brand-300 dark:border-brand-800 shadow-neo-sm">
                      {emp.firstName[0]}
                      {emp.lastName[0]}
                    </div>
                    <Badge variant={emp.status === 'ACTIVE' ? 'active' : 'draft'}>
                      {emp.status}
                    </Badge>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-base font-black text-ink-900 dark:text-ink-100 tracking-tight leading-tight">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs font-mono text-ink-500 dark:text-ink-400 mt-0.5">
                      {emp.employeeCode}
                    </p>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-ink-600 dark:text-ink-300">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                      <span className="truncate">{emp.jobPosition?.title || 'Team Member'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                      <span className="truncate">{emp.department?.name || 'General Operations'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                      <span className="truncate font-mono text-[11px]">{emp.workEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Details */}
                <div className="pt-3 border-t border-ink-200 dark:border-neutral-800 flex items-center justify-between text-xs font-medium">
                  {activeContract ? (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                      <FileText className="w-3.5 h-3.5" />
                      <span>${activeContract.wage.toLocaleString()}/mo</span>
                    </div>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 text-[11px] font-semibold">
                      No active contract
                    </span>
                  )}

                  <span className="text-[11px] font-bold text-brand-700 dark:text-brand-400">
                    View Hub →
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          isLoading={isLoading}
          onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
        />
      )}

      {/* New Employee Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create New Employee"
        description="Add employee master profile into the organizational system"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Work Email"
              type="email"
              required
              value={formData.workEmail}
              onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+1 555-0100"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              options={[
                { value: '', label: 'Select Department...' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <Select
              label="Job Position"
              value={formData.jobPositionId}
              onChange={(e) => setFormData({ ...formData, jobPositionId: e.target.value })}
              options={[
                { value: '', label: 'Select Position...' },
                ...jobPositions.map((p) => ({ value: p.id, label: p.title })),
              ]}
            />
          </div>

          <Select
            label="Working Schedule"
            value={formData.workingScheduleId}
            onChange={(e) => setFormData({ ...formData, workingScheduleId: e.target.value })}
            options={[
              { value: '', label: 'Select Schedule...' },
              ...schedules.map((s) => ({ value: s.id, label: `${s.name} (${s.calculatedWeeklyHours}h/wk)` })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bank Name"
              placeholder="Chase / Silicon Valley Bank"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
            <Input
              label="Bank Account Number"
              placeholder="ACC-99881122"
              value={formData.bankAccountNumber}
              onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Create Employee Profile
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
