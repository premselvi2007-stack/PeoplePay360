import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, UserCheck, UserX, Edit3 } from 'lucide-react';
import { api } from '../../lib/api';
import { User, UserRole } from '../../lib/types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { useToast } from '../../components/ui/Toast';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('EMPLOYEE');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch<User>(`/users/${id}/role`, { role }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role Updated', `User ${updated.email} is now ${updated.role}`);
      setEditingUser(null);
    },
    onError: (err: any) => toast.error('Update failed', err.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => api.patch<User>(`/users/${id}/toggle-active`),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(
        'Status Changed',
        `User ${updated.email} is now ${updated.isActive ? 'Active' : 'Suspended'}`,
      );
    },
    onError: (err: any) => toast.error('Action failed', err.message),
  });

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'HR_PAYROLL_MANAGER':
        return 'brand';
      case 'HR_PAYROLL_USER':
        return 'warning';
      case 'HR_MANAGER':
        return 'validated';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink-900 dark:text-ink-100 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-700 dark:text-brand-400" />
            Users & Security Access
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Manage administrative identities, role-based access levels (RBAC), and active credentials.
          </p>
        </div>
      </div>

      <Card className="p-4">
        <DataTable<User>
          data={users}
          isLoading={isLoading}
          emptyMessage="No registered users found."
          columns={[
            {
              header: 'User Account',
              accessor: (u) => (
                <div>
                  <strong className="text-ink-900 dark:text-ink-100">{u.email}</strong>
                  <div className="text-[11px] text-ink-500">
                    Created {new Date(u.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ),
            },
            {
              header: 'Linked Employee',
              accessor: (u) => (
                <span className="text-xs text-ink-700 dark:text-ink-300">
                  {u.employee ? `${u.employee.firstName} ${u.employee.lastName} (${u.employee.employeeCode})` : 'Unlinked System Account'}
                </span>
              ),
            },
            {
              header: 'Role',
              accessor: (u) => (
                <Badge variant={getRoleBadgeVariant(u.role)} size="sm">
                  {u.role.replace(/_/g, ' ')}
                </Badge>
              ),
            },
            {
              header: 'Status',
              accessor: (u) =>
                u.isActive ? (
                  <Badge variant="active" size="sm">Active</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Suspended</Badge>
                ),
            },
            {
              header: 'Actions',
              accessor: (u) => (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditingUser(u);
                      setSelectedRole(u.role);
                    }}
                    title="Change Role"
                  >
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Role
                  </Button>
                  <Button
                    size="sm"
                    variant={u.isActive ? 'secondary' : 'primary'}
                    onClick={() => toggleActiveMutation.mutate(u.id)}
                    title={u.isActive ? 'Suspend User' : 'Activate User'}
                  >
                    {u.isActive ? <UserX className="w-3.5 h-3.5 text-rose-600" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Edit Role Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Update Access Role: ${editingUser.email}`}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateRoleMutation.mutate({ id: editingUser.id, role: selectedRole });
            }}
            className="space-y-4"
          >
            <Select
              label="Role Assignment"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              options={[
                { value: 'EMPLOYEE', label: 'Employee (Self-Service View)' },
                { value: 'HR_MANAGER', label: 'HR Manager (Workforce & Leave Approver)' },
                { value: 'HR_PAYROLL_USER', label: 'HR Payroll User (Payrun Operator)' },
                { value: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager (Payrun Approver & Disburser)' },
                { value: 'ADMIN', label: 'Administrator (Full Access)' },
              ]}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={updateRoleMutation.isPending}>
                Save Role
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
