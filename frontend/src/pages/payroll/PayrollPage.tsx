import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  Plus,
  Play,
  CheckCircle2,
  Send,
  Download,
  AlertTriangle,
  FileText,
  Layers,
  ChevronRight,
  Eye,
  Trash2,
  RotateCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Payrun,
  Payslip,
  SalaryStructure,
  SalaryRule,
  Employee,
} from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';

export const PayrollPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isPayrollManager, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'payruns' | 'structures'>('payruns');
  const [statusFilter, setStatusFilter] = useState('');
  const [isNewBatchOpen, setIsNewBatchOpen] = useState(false);
  const [selectedPayrunId, setSelectedPayrunId] = useState<string | null>(null);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  // New Payrun Batch Form State
  const [batchForm, setBatchForm] = useState({
    name: '',
    salaryStructureId: '',
    periodStartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    periodEndDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split('T')[0],
    selectedEmployeeIds: [] as string[],
  });

  // Fetch all payruns
  const { data: payruns = [], isLoading: isPayrunsLoading } = useQuery({
    queryKey: ['payruns', statusFilter],
    queryFn: () => api.get<Payrun[]>('/payruns', { status: statusFilter || undefined }),
  });

  // Fetch salary structures
  const { data: structures = [] } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => api.get<SalaryStructure[]>('/salary-structures'),
  });

  // Fetch selected payrun details
  const { data: selectedPayrun, isLoading: isPayrunLoading } = useQuery({
    queryKey: ['payrun', selectedPayrunId],
    queryFn: () => api.get<Payrun>(`/payruns/${selectedPayrunId}`),
    enabled: !!selectedPayrunId,
  });

  // Fetch eligible employees when creating batch
  const { data: eligibleEmployees = [], isFetching: isEligibleLoading } = useQuery({
    queryKey: ['eligible-employees', batchForm.salaryStructureId, batchForm.periodStartDate, batchForm.periodEndDate],
    queryFn: () =>
      api.get<Employee[]>('/payruns/eligible-employees', {
        salaryStructureId: batchForm.salaryStructureId,
        periodStartDate: batchForm.periodStartDate,
        periodEndDate: batchForm.periodEndDate,
      }),
    enabled: !!batchForm.salaryStructureId && isNewBatchOpen,
  });

  // Payrun Batch Mutations
  const createBatchMutation = useMutation({
    mutationFn: (data: typeof batchForm) => api.post<Payrun>('/payruns/create-batch', data),
    onSuccess: (newPayrun) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      toast.success('Payrun Batch Created', `Batch "${newPayrun.name}" is now in Draft.`);
      setIsNewBatchOpen(false);
      setSelectedPayrunId(newPayrun.id);
    },
    onError: (err: any) => toast.error('Creation failed', err.message),
  });

  const computeMutation = useMutation({
    mutationFn: (id: string) => api.post<Payrun>(`/payruns/${id}/compute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', selectedPayrunId] });
      toast.success('Payrun Computed', 'All eligible payslips have been computed.');
    },
    onError: (err: any) => toast.error('Computation failed', err.message),
  });

  const validateMutation = useMutation({
    mutationFn: (id: string) => api.post<Payrun>(`/payruns/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', selectedPayrunId] });
      toast.success('Payrun Validated', 'Batch marked validated and payslips locked.');
    },
    onError: (err: any) => toast.error('Validation failed', err.message),
  });

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post<Payrun>(`/payruns/${id}/mark-paid`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['payrun', selectedPayrunId] });
      toast.success('Marked as Paid', 'Payrun disbursement finalized.');
    },
    onError: (err: any) => toast.error('Action failed', err.message),
  });

  const sendPayslipsMutation = useMutation({
    mutationFn: (id: string) => api.post<any>(`/payruns/${id}/send-payslips`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['payrun', selectedPayrunId] });
      toast.success('Dispatched Payslips', `Dispatched emails to employees (${res.sent || 0} sent).`);
    },
    onError: (err: any) => toast.error('Email dispatch failed', err.message),
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/payruns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setSelectedPayrunId(null);
      toast.success('Payrun Deleted', 'Batch and draft payslips removed.');
    },
    onError: (err: any) => toast.error('Delete failed', err.message),
  });

  const handleDownloadPdf = async (payslipId: string, employeeCode: string) => {
    try {
      await api.downloadPdf(`/payslips/${payslipId}/pdf`, `payslip-${employeeCode}.pdf`);
      toast.success('Downloaded Payslip', `Saved PDF for employee ${employeeCode}`);
    } catch (err: any) {
      toast.error('Download error', err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="draft">DRAFT</Badge>;
      case 'COMPUTED':
        return <Badge variant="validated">COMPUTED</Badge>;
      case 'VALIDATED':
        return <Badge variant="warning">VALIDATED</Badge>;
      case 'PAID':
        return <Badge variant="paid">PAID</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">CANCELLED</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const totalPaidSum = payruns
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.totalNet || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-brand-700 dark:text-brand-400" />
            Payroll Operations
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Execute batch payruns, compute salary rules, validate disbursements, and dispatch PDF payslips.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'payruns' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('payruns')}
          >
            <Layers className="w-4 h-4 mr-1.5" />
            Payrun Batches
          </Button>
          <Button
            variant={activeTab === 'structures' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('structures')}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Salary Structures
          </Button>
          {activeTab === 'payruns' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (structures.length > 0 && !batchForm.salaryStructureId) {
                  setBatchForm((prev) => ({
                    ...prev,
                    salaryStructureId: structures[0].id,
                    name: `Payrun - ${new Date().toLocaleString('default', { month: 'short' })} ${new Date().getFullYear()}`,
                  }));
                }
                setIsNewBatchOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Payrun Batch
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'payruns' && (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Total Payruns
              </span>
              <p className="text-2xl font-black text-ink-900 dark:text-ink-100 mt-1">{payruns.length}</p>
            </Card>

            <Card className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Draft / Computed
              </span>
              <p className="text-2xl font-black text-brand-700 dark:text-brand-400 mt-1">
                {payruns.filter((p) => p.status === 'DRAFT' || p.status === 'COMPUTED').length}
              </p>
            </Card>

            <Card className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Awaiting Payment
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                {payruns.filter((p) => p.status === 'VALIDATED').length}
              </p>
            </Card>

            <Card className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
              <span className="text-xs font-bold text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                Total Net Disbursed
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ${totalPaidSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </Card>
          </div>

          {/* Payruns List Table */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-extrabold text-base text-ink-900 dark:text-ink-100">Payrun Batches</h2>
              <div className="w-48">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'COMPUTED', label: 'Computed' },
                    { value: 'VALIDATED', label: 'Validated' },
                    { value: 'PAID', label: 'Paid' },
                  ]}
                />
              </div>
            </div>

            <DataTable<Payrun>
              data={payruns}
              isLoading={isPayrunsLoading}
              emptyMessage="No payrun batches created yet. Click 'New Payrun Batch' to begin."
              onRowClick={(row) => setSelectedPayrunId(row.id)}
              columns={[
                {
                  header: 'Batch Name',
                  accessor: (row) => (
                    <div>
                      <span className="font-bold text-ink-900 dark:text-ink-100">{row.name}</span>
                      <div className="text-[11px] text-ink-500">
                        {new Date(row.periodStartDate).toLocaleDateString()} – {new Date(row.periodEndDate).toLocaleDateString()}
                      </div>
                    </div>
                  ),
                },
                {
                  header: 'Structure',
                  accessor: (row) => (
                    <span className="text-xs font-mono bg-ink-100 dark:bg-neutral-800 px-2 py-0.5 rounded border border-ink-300 dark:border-neutral-700">
                      {row.salaryStructure?.name || 'Default'}
                    </span>
                  ),
                },
                {
                  header: 'Headcount',
                  accessor: (row) => (
                    <span className="text-xs font-bold text-ink-700 dark:text-ink-300">
                      {row.employeeCount || (row as any)._count?.payslips || 0} employees
                    </span>
                  ),
                },
                {
                  header: 'Total Gross',
                  accessor: (row) => (
                    <span className="text-xs font-bold text-ink-800 dark:text-ink-200">
                      ${(row.totalGross || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Total Net',
                  accessor: (row) => (
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                      ${(row.totalNet || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ),
                },
                {
                  header: 'Status',
                  accessor: (row) => getStatusBadge(row.status),
                },
                {
                  header: 'Actions',
                  accessor: (row) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayrunId(row.id);
                      }}
                    >
                      Inspect <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </>
      )}

      {/* Salary Structures Tab */}
      {activeTab === 'structures' && (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-extrabold text-base text-ink-900 dark:text-ink-100 mb-2">
              Configured Salary Structures & Rules
            </h2>
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-4">
              Deterministic rule hierarchies evaluated sequentially (Basic → Allowances → Gross → Deductions → Net).
            </p>

            <div className="space-y-4">
              {structures.map((struct) => (
                <div
                  key={struct.id}
                  className="p-4 bg-canvas-light dark:bg-neutral-900 rounded-neo border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-ink-200 dark:border-neutral-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-ink-900 dark:text-ink-100">{struct.name}</h3>
                        <Badge variant="brand" size="sm">{struct.code}</Badge>
                      </div>
                      {struct.description && (
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{struct.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-ink-600 dark:text-ink-300">
                      {(struct.rules?.length || struct._count?.rules || 0)} Rules Defined
                    </span>
                  </div>

                  {struct.rules && struct.rules.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-ink-300 dark:border-neutral-700 text-ink-500 dark:text-ink-400">
                            <th className="py-1.5 px-2">Seq</th>
                            <th className="py-1.5 px-2">Rule Name</th>
                            <th className="py-1.5 px-2">Category</th>
                            <th className="py-1.5 px-2">Type</th>
                            <th className="py-1.5 px-2">Formula / Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-200 dark:divide-neutral-800 font-mono">
                          {struct.rules
                            .sort((a, b) => a.sequence - b.sequence)
                            .map((r) => (
                              <tr key={r.id}>
                                <td className="py-1.5 px-2 text-ink-400">{r.sequence}</td>
                                <td className="py-1.5 px-2 font-sans font-bold text-ink-900 dark:text-ink-100">
                                  {r.name} <span className="text-ink-400 font-mono text-[11px]">({r.code})</span>
                                </td>
                                <td className="py-1.5 px-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      r.category === 'DEDUCTION'
                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        : r.category === 'NET'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
                                    }`}
                                  >
                                    {r.category}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2 text-ink-600 dark:text-ink-400 font-sans">{r.computationType}</td>
                                <td className="py-1.5 px-2 text-ink-700 dark:text-ink-300">
                                  {r.formula || (r.percentage ? `${r.percentage}% of ${r.percentageOf}` : `$${r.fixedAmount}`)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Payrun Detail Drawer / Modal */}
      {selectedPayrunId && (
        <Modal
          isOpen={!!selectedPayrunId}
          onClose={() => setSelectedPayrunId(null)}
          title={`Payrun: ${selectedPayrun?.name || 'Loading...'}`}
          maxWidth="xl"
        >
          {isPayrunLoading || !selectedPayrun ? (
            <div className="p-8 text-center text-xs text-ink-500">Loading batch details...</div>
          ) : (
            <div className="space-y-6">
              {/* Batch Summary & Controls */}
              <div className="p-4 bg-canvas-light dark:bg-neutral-900 rounded-neo border-2 border-ink-900 dark:border-neutral-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-ink-500 dark:text-ink-400">Status:</span>
                    {getStatusBadge(selectedPayrun.status)}
                    <span className="text-xs text-ink-400 ml-2 font-mono">
                      {new Date(selectedPayrun.periodStartDate).toLocaleDateString()} to{' '}
                      {new Date(selectedPayrun.periodEndDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span>
                      Gross: <strong>${(selectedPayrun.totalGross || 0).toLocaleString()}</strong>
                    </span>
                    <span>
                      Deductions: <strong>${(selectedPayrun.totalDeduction || 0).toLocaleString()}</strong>
                    </span>
                    <span>
                      Net: <strong className="text-emerald-600">${(selectedPayrun.totalNet || 0).toLocaleString()}</strong>
                    </span>
                    <span>Employees: <strong>{selectedPayrun.payslips?.length || 0}</strong></span>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {selectedPayrun.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={computeMutation.isPending}
                      onClick={() => computeMutation.mutate(selectedPayrun.id)}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      Compute Payrun
                    </Button>
                  )}

                  {selectedPayrun.status === 'COMPUTED' && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={computeMutation.isPending}
                        onClick={() => computeMutation.mutate(selectedPayrun.id)}
                        title="Recompute all payslips"
                      >
                        <RotateCw className="w-3.5 h-3.5 mr-1" />
                        Recompute
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={validateMutation.isPending}
                        onClick={() => validateMutation.mutate(selectedPayrun.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Validate Batch
                      </Button>
                    </>
                  )}

                  {selectedPayrun.status === 'VALIDATED' && (isPayrollManager || isAdmin) && (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={markPaidMutation.isPending}
                        onClick={() => markPaidMutation.mutate(selectedPayrun.id)}
                      >
                        <DollarSign className="w-3.5 h-3.5 mr-1" />
                        Mark as Paid
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={sendPayslipsMutation.isPending}
                        onClick={() => sendPayslipsMutation.mutate(selectedPayrun.id)}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        Send Payslips
                      </Button>
                    </>
                  )}

                  {selectedPayrun.status === 'PAID' && (isPayrollManager || isAdmin) && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={sendPayslipsMutation.isPending}
                      onClick={() => sendPayslipsMutation.mutate(selectedPayrun.id)}
                    >
                      <Send className="w-3.5 h-3.5 mr-1" />
                      Re-send Payslips
                    </Button>
                  )}

                  {selectedPayrun.status !== 'PAID' && (isPayrollManager || isAdmin) && (
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={deleteBatchMutation.isPending}
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this payrun batch?')) {
                          deleteBatchMutation.mutate(selectedPayrun.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Warnings / Errors Banner if any */}
              {selectedPayrun.warnings && selectedPayrun.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 rounded-neo">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Payroll Warnings & Discrepancies ({selectedPayrun.warnings.length})</span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300 list-disc list-inside">
                    {selectedPayrun.warnings.map((w) => (
                      <li key={w.id}>
                        {w.employee ? `${w.employee.firstName} ${w.employee.lastName} (${w.employee.employeeCode}): ` : ''}
                        {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Payslips Table */}
              <div>
                <h3 className="font-extrabold text-sm text-ink-900 dark:text-ink-100 mb-3">
                  Individual Payslips ({selectedPayrun.payslips?.length || 0})
                </h3>

                <DataTable<Payslip>
                  data={selectedPayrun.payslips || []}
                  emptyMessage="No payslips generated yet."
                  columns={[
                    {
                      header: 'Employee',
                      accessor: (row) => (
                        <div>
                          <p className="font-bold text-ink-900 dark:text-ink-100">
                            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : 'N/A'}
                          </p>
                          <p className="text-[11px] text-ink-500">{row.employee?.employeeCode}</p>
                        </div>
                      ),
                    },
                    {
                      header: 'Worked',
                      accessor: (row) => (
                        <span className="text-xs text-ink-700 dark:text-ink-300">
                          {row.workedDays} days ({row.actualWorkedHours}h)
                        </span>
                      ),
                    },
                    {
                      header: 'Gross Salary',
                      accessor: (row) => (
                        <span className="text-xs font-bold text-ink-800 dark:text-ink-200">
                          ${(row.grossSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ),
                    },
                    {
                      header: 'Deductions',
                      accessor: (row) => (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                          -${(row.totalDeductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ),
                    },
                    {
                      header: 'Net Salary',
                      accessor: (row) => (
                        <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          ${(row.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ),
                    },
                    {
                      header: 'Email',
                      accessor: (row) =>
                        row.isEmailSent ? (
                          <Badge variant="active" size="sm">Sent</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">Pending</Badge>
                        ),
                    },
                    {
                      header: 'Actions',
                      accessor: (row) => (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedPayslip(row)}
                            title="View Calculation Breakdown"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownloadPdf(row.id, row.employee?.employeeCode || 'slip')}
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Payslip Calculation Detail Breakdown Modal */}
      {selectedPayslip && (
        <Modal
          isOpen={!!selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
          title={`Payslip Breakdown: ${selectedPayslip.employee?.firstName} ${selectedPayslip.employee?.lastName}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-canvas-light dark:bg-neutral-900 rounded-neo border border-ink-300 dark:border-neutral-700">
              <div>
                <span className="text-xs text-ink-500">Employee Code:</span>{' '}
                <strong className="text-xs text-ink-900 dark:text-ink-100">{selectedPayslip.employee?.employeeCode}</strong>
                <div className="text-xs text-ink-500 mt-1">
                  Contract Wage: <strong>${selectedPayslip.contract?.wage?.toLocaleString() || 0}</strong>
                </div>
              </div>
              <div className="text-right mt-2 sm:mt-0">
                <span className="text-xs text-ink-500">Net Pay:</span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ${(selectedPayslip.netSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-ink-900 dark:border-neutral-700 text-ink-600 dark:text-ink-400">
                    <th className="py-2 px-2">Seq</th>
                    <th className="py-2 px-2">Rule</th>
                    <th className="py-2 px-2">Category</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-200 dark:divide-neutral-800">
                  {selectedPayslip.lines && selectedPayslip.lines.length > 0 ? (
                    selectedPayslip.lines.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2 px-2 text-ink-400 font-mono">{line.sequence}</td>
                        <td className="py-2 px-2 font-bold text-ink-900 dark:text-ink-100">
                          {line.ruleName}{' '}
                          <span className="text-[10px] font-mono text-ink-400">({line.ruleCode})</span>
                        </td>
                        <td className="py-2 px-2">
                          <Badge
                            variant={
                              line.category === 'DEDUCTION'
                                ? 'danger'
                                : line.category === 'NET'
                                ? 'paid'
                                : 'brand'
                            }
                            size="sm"
                          >
                            {line.category}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold">
                          ${(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-ink-500">
                        No rule lines computed. Click 'Compute Payrun' to evaluate rules.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ink-200 dark:border-neutral-800">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  handleDownloadPdf(selectedPayslip.id, selectedPayslip.employee?.employeeCode || 'slip')
                }
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Download PDF Payslip
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New Payrun Batch Modal */}
      {isNewBatchOpen && (
        <Modal
          isOpen={isNewBatchOpen}
          onClose={() => setIsNewBatchOpen(false)}
          title="Create New Payrun Batch"
          maxWidth="lg"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBatchMutation.mutate(batchForm);
            }}
            className="space-y-4"
          >
            <Input
              label="Batch Name"
              required
              value={batchForm.name}
              onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
              placeholder="e.g. October 2026 Regular Payrun"
            />

            <Select
              label="Salary Structure"
              required
              value={batchForm.salaryStructureId}
              onChange={(e) => setBatchForm({ ...batchForm, salaryStructureId: e.target.value })}
              options={[
                { value: '', label: 'Select Salary Structure...' },
                ...structures.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
              ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Period Start Date"
                type="date"
                required
                value={batchForm.periodStartDate}
                onChange={(e) => setBatchForm({ ...batchForm, periodStartDate: e.target.value })}
              />
              <Input
                label="Period End Date"
                type="date"
                required
                value={batchForm.periodEndDate}
                onChange={(e) => setBatchForm({ ...batchForm, periodEndDate: e.target.value })}
              />
            </div>

            {/* Eligible Employees Preview */}
            <div className="p-3 bg-canvas-light dark:bg-neutral-900 rounded-neo border border-ink-300 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-ink-900 dark:text-ink-100">
                  Eligible Active Contracts ({eligibleEmployees.length})
                </span>
                <span className="text-[11px] text-ink-500">
                  {batchForm.selectedEmployeeIds.length === 0
                    ? 'All eligible will be included'
                    : `${batchForm.selectedEmployeeIds.length} selected`}
                </span>
              </div>

              {isEligibleLoading ? (
                <div className="text-xs text-ink-500 py-2">Resolving eligible contracts...</div>
              ) : eligibleEmployees.length > 0 ? (
                <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-ink-200 dark:divide-neutral-800">
                  {eligibleEmployees.map((emp) => (
                    <div key={emp.id} className="pt-1 flex items-center justify-between text-xs">
                      <span>
                        {emp.firstName} {emp.lastName} <span className="text-ink-400">({emp.employeeCode})</span>
                      </span>
                      <span className="text-emerald-600 font-bold">Active Contract</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-amber-600 py-1">
                  Select a salary structure to load eligible employees with active contracts.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsNewBatchOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={createBatchMutation.isPending}>
                Create Draft Batch
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
