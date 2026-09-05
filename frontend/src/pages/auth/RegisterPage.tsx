import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register(formData);
      toast.success('Account Created', 'Welcome to PeoplePay360');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="p-8 shadow-neo-lg dark:shadow-neo-dark-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
            Create an Account
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Join the PeoplePay360 HR & Payroll workspace
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-neo bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              placeholder="Jane"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Work Email"
            type="email"
            placeholder="jane.doe@company.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />

          <Select
            label="System Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'EMPLOYEE', label: 'Employee (Self-Service Portal)' },
              { value: 'HR_MANAGER', label: 'HR Manager (Employee & Leaves)' },
              { value: 'HR_PAYROLL_USER', label: 'HR Payroll User (Payrun Operator)' },
              { value: 'HR_PAYROLL_MANAGER', label: 'HR Payroll Manager (Full Payroll CRUD)' },
              { value: 'ADMIN', label: 'Admin (Complete System Access)' },
            ]}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Create Account
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-ink-500 dark:text-ink-400">
          Already have an account?{' '}
          <NavLink to="/login" className="font-bold text-brand-700 dark:text-brand-400 hover:underline">
            Sign In
          </NavLink>
        </div>
      </Card>
    </div>
  );
};
