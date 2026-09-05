import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { WorkingSchedule } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';

export const SchedulesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    scheduleType: 'STANDARD',
  });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['working-schedules', searchTerm],
    queryFn: () =>
      api.get<WorkingSchedule[]>('/working-schedules', {
        search: searchTerm || undefined,
      }),
  });

  const createMutation = useMutation({
    mutationFn: (newSchedule: any) => api.post<WorkingSchedule>('/working-schedules', newSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-schedules'] });
      toast.success('Schedule Created', 'New working schedule template added.');
      setIsNewModalOpen(false);
      setFormData({ name: '', scheduleType: 'STANDARD' });
    },
    onError: (err: any) => {
      toast.error('Failed to create schedule', err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Name',
      accessor: (row: WorkingSchedule) => <span className="font-bold text-ink-900 dark:text-ink-100">{row.name}</span>,
    },
    {
      header: 'Type',
      accessor: (row: WorkingSchedule) => row.scheduleType,
    },
    {
      header: 'Calculated Hours/Week',
      accessor: (row: WorkingSchedule) => (
        <span className="font-mono text-brand-700 dark:text-brand-400 font-bold">
          {row.calculatedWeeklyHours}h
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: WorkingSchedule) => (
        <Badge variant={row.isActive ? 'active' : 'draft'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Assigned Employees',
      accessor: (row: WorkingSchedule) => (
        <Badge variant="brand" size="sm">
          {row._count?.employees || 0} employees
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
            Working Schedules
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Define standard work hours, shifts, and weekly schedule templates
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          New Schedule
        </Button>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-surface-light/50 dark:bg-surface-dark/50 shadow-none border-dashed border-ink-300 dark:border-neutral-700">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightElement={<Search className="w-4 h-4 text-ink-400" />}
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={schedules}
        isLoading={isLoading}
      />

      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Schedule Template"
        description="Add a new master schedule (e.g. Standard 40h/week)"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Schedule Name"
            placeholder="e.g. Standard 40 Hours"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Create Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
