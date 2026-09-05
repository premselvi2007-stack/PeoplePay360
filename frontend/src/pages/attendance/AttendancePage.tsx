import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Search, LogIn, LogOut, CheckCircle2, RotateCw } from 'lucide-react';
import { api } from '../../lib/api';
import { Attendance } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DataTable } from '../../components/ui/DataTable';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { format } from 'date-fns';

export const AttendancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Real-time today's status for the logged in user
  const { data: todayAttendance, refetch: refetchToday } = useQuery({
    queryKey: ['attendance-today', user?.employeeId],
    queryFn: () => api.get<any>('/attendance/today'),
    enabled: !!user?.employeeId,
  });

  const isCheckedIn = !!todayAttendance?.isCheckedIn;
  const isCheckedOut = !!todayAttendance?.isCheckedOut;
  const checkInTime = todayAttendance?.record?.checkIn
    ? new Date(todayAttendance.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  const checkOutTime = todayAttendance?.record?.checkOut
    ? new Date(todayAttendance.record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const punchInMutation = useMutation({
    mutationFn: () => api.post('/attendance/check-in', { timestamp: new Date().toISOString() }),
    onSuccess: () => {
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      toast.success(
        isCheckedOut ? 'Shift Resumed' : 'Punched In Successfully',
        `Recorded at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      );
    },
    onError: (err: any) => toast.error('Punch In Error', err.message),
  });

  const punchOutMutation = useMutation({
    mutationFn: () => api.post('/attendance/check-out', { timestamp: new Date().toISOString() }),
    onSuccess: (res: any) => {
      refetchToday();
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      toast.success(
        isCheckedOut ? 'Updated Check-out' : 'Punched Out Successfully',
        `Shift duration: ${res?.workedHours ?? todayAttendance?.record?.workedHours ?? 0} hrs recorded`
      );
    },
    onError: (err: any) => toast.error('Punch Out Error', err.message),
  });

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
            Attendance Logs & Punch Card
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Monitor daily check-ins, worked hours, and manage shift punches
          </p>
        </div>
      </div>

      {/* Interactive Today's Punch Card */}
      {user?.employeeId && (
        <Card className="p-4 bg-surface-light dark:bg-surface-dark border-2 border-ink-900 dark:border-neutral-700 shadow-neo-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-neo bg-brand-50 dark:bg-brand-950 border border-brand-300 dark:border-brand-800 flex items-center justify-center text-brand-700 dark:text-brand-300">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink-500 uppercase tracking-wider">Today's Punch Status:</span>
                  {isCheckedIn && (
                    <Badge variant="active" size="sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block" />
                      Clocked In ({checkInTime})
                    </Badge>
                  )}
                  {isCheckedOut && (
                    <Badge variant="validated" size="sm">
                      Shift Completed ({todayAttendance?.record?.workedHours} hrs)
                    </Badge>
                  )}
                  {!isCheckedIn && !isCheckedOut && (
                    <Badge variant="neutral" size="sm">Not Checked In</Badge>
                  )}
                </div>
                <p className="text-xs text-ink-600 dark:text-ink-300 mt-0.5">
                  {isCheckedIn
                    ? `Checked in at ${checkInTime}. Remember to punch out at the end of your shift.`
                    : isCheckedOut
                    ? `Shift concluded at ${checkOutTime}. Recorded ${todayAttendance?.record?.workedHours} worked hours.`
                    : 'No attendance recorded yet today. Click Punch In to begin tracking work hours.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(!isCheckedIn || isCheckedOut) && (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={punchInMutation.isPending}
                  onClick={() => punchInMutation.mutate()}
                >
                  <LogIn className="w-4 h-4 mr-1.5" />
                  {isCheckedOut ? 'Punch In Again' : 'Punch In Now'}
                </Button>
              )}

              {(isCheckedIn || isCheckedOut) && (
                <Button
                  variant={isCheckedIn ? 'secondary' : 'secondary'}
                  size="sm"
                  isLoading={punchOutMutation.isPending}
                  onClick={() => punchOutMutation.mutate()}
                  className={isCheckedIn ? 'bg-rose-600 text-white hover:bg-rose-700 border-rose-700' : ''}
                >
                  <LogOut className="w-4 h-4 mr-1.5" />
                  {isCheckedOut ? 'Update Punch Out' : 'Punch Out Now'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

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
