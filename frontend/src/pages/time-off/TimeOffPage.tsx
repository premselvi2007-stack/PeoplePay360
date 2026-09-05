import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { TimeOffRequest, TimeOffType, Employee } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export const TimeOffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    timeOffTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['time-off-requests', searchTerm],
    queryFn: () =>
      api.get<TimeOffRequest[]>('/time-off/requests', {
        search: searchTerm || undefined,
      }),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get<Employee[]>('/employees'),
  });

  const { data: timeOffTypes = [] } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => api.get<TimeOffType[]>('/time-off/types'),
  });

  const createMutation = useMutation({
    mutationFn: (newReq: any) => api.post<TimeOffRequest>('/time-off/requests', newReq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      toast.success('Request Submitted', 'Time off request has been created.');
      setIsNewModalOpen(false);
      setFormData({
        employeeId: '',
        timeOffTypeId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reason: '',
      });
    },
    onError: (err: any) => {
      toast.error('Failed to submit request', err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Employee',
      accessor: (row: TimeOffRequest) => (
        <span className="font-bold text-ink-900 dark:text-ink-100">
          {row.employee?.firstName} {row.employee?.lastName}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (row: TimeOffRequest) => (
        <span className="text-xs font-bold" style={{ color: row.timeOffType?.colorHex }}>
          {row.timeOffType?.name}
        </span>
      ),
    },
    {
      header: 'Duration',
      accessor: (row: TimeOffRequest) => (
        <span className="font-mono text-xs">
          {format(new Date(row.startDate), 'MMM dd')} - {format(new Date(row.endDate), 'MMM dd, yyyy')}
          <span className="ml-2 font-bold text-ink-900 dark:text-ink-100">
            ({row.duration} {row.timeOffType?.unit.toLowerCase()})
          </span>
        </span>
      ),
    },
    {
      header: 'Reason',
      accessor: (row: TimeOffRequest) => (
        <span className="text-xs text-ink-500 dark:text-ink-400 truncate max-w-[150px] inline-block">
          {row.reason || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: TimeOffRequest) => {
        let variant: any = 'default';
        if (row.status === 'APPROVED') variant = 'active';
        else if (row.status === 'SUBMITTED') variant = 'warning';
        else if (row.status === 'REFUSED') variant = 'error';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-brand-700 dark:text-brand-400" />
            Time Off Requests
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Manage employee absences, vacations, and sick leaves
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          New Request
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-surface-light/50 dark:bg-surface-dark/50 shadow-none border-dashed border-ink-300 dark:border-neutral-700">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search employee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightElement={<Search className="w-4 h-4 text-ink-400" />}
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={requests}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Submit Time Off Request"
        description="Create a new leave request for an employee"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Employee"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            required
            options={[
              { value: '', label: 'Select Employee...' },
              ...employees.map((emp) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName}`,
              })),
            ]}
          />

          <Select
            label="Time Off Type"
            value={formData.timeOffTypeId}
            onChange={(e) => setFormData({ ...formData, timeOffTypeId: e.target.value })}
            required
            options={[
              { value: '', label: 'Select Type...' },
              ...timeOffTypes.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              required
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <Input
            label="Reason"
            placeholder="Optional explanation..."
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
