import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Search, Filter } from 'lucide-react';
import { api } from '../../lib/api';
import { Attendance } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/ui/DataTable';
import { format } from 'date-fns';

export const AttendancePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: attendances = [], isLoading } = useQuery({
    queryKey: ['attendances', searchTerm, statusFilter],
    queryFn: () =>
      api.get<Attendance[]>('/attendance', {
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const columns = [
    {
      header: 'Employee',
      accessor: (row: Attendance) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-bold text-[10px] flex items-center justify-center border border-brand-300 dark:border-brand-800">
            {row.employee?.firstName?.[0]}{row.employee?.lastName?.[0]}
          </div>
          <span className="font-bold text-ink-900 dark:text-ink-100">
            {row.employee?.firstName} {row.employee?.lastName}
          </span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessor: (row: Attendance) => (
        <span className="font-mono text-xs">{format(new Date(row.date), 'MMM dd, yyyy')}</span>
      ),
    },
    {
      header: 'Check In',
      accessor: (row: Attendance) => row.checkIn ? (
        <span className="font-mono text-xs text-ink-600 dark:text-ink-300">
          {format(new Date(row.checkIn), 'hh:mm a')}
        </span>
      ) : '-',
    },
    {
      header: 'Check Out',
      accessor: (row: Attendance) => row.checkOut ? (
        <span className="font-mono text-xs text-ink-600 dark:text-ink-300">
          {format(new Date(row.checkOut), 'hh:mm a')}
        </span>
      ) : '-',
    },
    {
      header: 'Worked Hours',
      accessor: (row: Attendance) => (
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {row.workedHours.toFixed(2)}h
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Attendance) => {
        let variant: any = 'default';
        if (row.status === 'PRESENT') variant = 'active';
        else if (row.status === 'LATE' || row.status === 'OVERTIME') variant = 'warning';
        else if (row.status === 'ABSENT' || row.status === 'MISSING_CHECKOUT') variant = 'error';
        
        return <Badge variant={variant}>{row.status.replace('_', ' ')}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-brand-700 dark:text-brand-400" />
            Attendance Logs
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Monitor daily check-ins, worked hours, and identify attendance exceptions
          </p>
        </div>
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
        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'PRESENT', label: 'Present' },
              { value: 'LATE', label: 'Late' },
              { value: 'ABSENT', label: 'Absent' },
              { value: 'OVERTIME', label: 'Overtime' },
              { value: 'MISSING_CHECKOUT', label: 'Missing Check-out' },
            ]}
          />
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={attendances}
        isLoading={isLoading}
      />
    </div>
  );
};
