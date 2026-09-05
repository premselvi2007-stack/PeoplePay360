import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { Contract, Employee, SalaryStructure } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';

export const ContractsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Form state for creating new contract
  const [formData, setFormData] = useState({
    contractReference: '',
    employeeId: '',
    salaryStructureId: '',
    wage: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    contractType: 'FULL_TIME',
    status: 'RUNNING',
    notes: '',
  });

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts', searchTerm, statusFilter],
    queryFn: () =>
      api.get<Contract[]>('/contracts', {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get<Employee[]>('/employees'),
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures-list'],
    queryFn: () => api.get<SalaryStructure[]>('/salary-structures'),
  });

  const createMutation = useMutation({
    mutationFn: (newContract: any) =>
      api.post<Contract>('/contracts', {
        ...newContract,
        wage: Number(newContract.wage),
        endDate: newContract.endDate ? newContract.endDate : undefined,
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Contract Created', `Contract ${created.contractReference} has been established.`);
      setIsNewModalOpen(false);
      setFormData({
        contractReference: '',
        employeeId: '',
        salaryStructureId: '',
        wage: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        contractType: 'FULL_TIME',
        status: 'RUNNING',
        notes: '',
      });
    },
    onError: (err: any) => {
      toast.error('Failed to create contract', err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Reference',
      accessor: (row: Contract) => <span className="font-mono font-bold text-ink-900 dark:text-ink-100">{row.contractReference}</span>,
    },
    {
      header: 'Employee',
      accessor: (row: Contract) => (
        <div className="font-bold text-ink-900 dark:text-ink-100">
          {row.employee?.firstName} {row.employee?.lastName}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (row: Contract) => row.contractType.replace('_', ' '),
    },
    {
      header: 'Salary Structure',
      accessor: (row: Contract) => (
        <span className="text-xs text-brand-700 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800">
          {row.salaryStructure?.name || 'N/A'}
        </span>
      ),
    },
    {
      header: 'Wage',
      accessor: (row: Contract) => (
        <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          ${row.wage.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Start Date',
      accessor: (row: Contract) => new Date(row.startDate).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: (row: Contract) => {
        let variant: any = 'default';
        if (row.status === 'RUNNING') variant = 'active';
        else if (row.status === 'EXPIRED') variant = 'error';
        else if (row.status === 'DRAFT') variant = 'draft';
        return <Badge variant={variant}>{row.status}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
            Contracts
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Manage employee employment agreements, wages, and active periods
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsNewModalOpen(true)}
        >
          New Contract
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-surface-light/50 dark:bg-surface-dark/50 shadow-none border-dashed border-ink-300 dark:border-neutral-700">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search reference or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightElement={<Search className="w-4 h-4 text-ink-400" />}
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'RUNNING', label: 'Running' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'EXPIRED', label: 'Expired' },
            ]}
          />
        </div>
      </Card>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
      />

      {/* New Contract Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create Contract"
        description="Establish a new employment agreement and salary structure"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Contract Reference"
            placeholder="CONT-2026-001"
            required
            value={formData.contractReference}
            onChange={(e) => setFormData({ ...formData, contractReference: e.target.value })}
          />

          <Select
            label="Employee"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            required
            options={[
              { value: '', label: 'Select Employee...' },
              ...employees.map((emp) => ({
                value: emp.id,
                label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`,
              })),
            ]}
          />

          <Select
            label="Salary Structure"
            value={formData.salaryStructureId}
            onChange={(e) => setFormData({ ...formData, salaryStructureId: e.target.value })}
            required
            options={[
              { value: '', label: 'Select Structure...' },
              ...structures.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monthly Wage"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.wage.toString()}
              onChange={(e) => setFormData({ ...formData, wage: Number(e.target.value) })}
            />
            <Select
              label="Contract Type"
              value={formData.contractType}
              onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
              options={[
                { value: 'FULL_TIME', label: 'Full Time' },
                { value: 'PART_TIME', label: 'Part Time' },
                { value: 'INTERNSHIP', label: 'Internship' },
                { value: 'CONTRACTOR', label: 'Contractor' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-ink-200 dark:border-neutral-800">
            <Button variant="outline" type="button" onClick={() => setIsNewModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              Save Contract
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
