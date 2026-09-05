import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, UserCheck, Briefcase, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome Back', 'Signed in successfully');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLoading(true);
    setError(null);

    try {
      await login(demoEmail, 'password123');
      toast.success('Demo Account Loaded', `Logged in as ${demoEmail}`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <Card className="p-8 shadow-neo-lg dark:shadow-neo-dark-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-neo bg-brand-700 text-white font-black text-xl mb-3 shadow-neo-sm">
            P
          </div>
          <h2 className="text-2xl font-black text-ink-900 dark:text-ink-100 tracking-tight">
            Sign in to PeoplePay360
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            Integrated Human Resource & Payroll Operations
          </p>
        </div>

        {error && (
          <div className="p-3 mb-5 rounded-neo bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className="mt-5 text-center text-xs text-ink-500 dark:text-ink-400">
          Don't have an account?{' '}
          <NavLink to="/register" className="font-bold text-brand-700 dark:text-brand-400 hover:underline">
            Register New Employee
          </NavLink>
        </div>
      </Card>

      {/* Demo Fast Switcher Card for Hackathon Jury */}
      <div className="bg-canvas-light dark:bg-neutral-900 border border-ink-300 dark:border-neutral-700 rounded-neo p-4">
        <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-ink-700 dark:text-ink-300 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-brand-700 dark:text-brand-400" />
          <span>Quick Demo Roles (1-Click Login)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoLogin('admin@peoplepay360.com')}
            className="p-2 text-left bg-surface-light dark:bg-surface-dark border border-ink-900 dark:border-neutral-700 rounded-neo hover:bg-brand-50 dark:hover:bg-neutral-800 transition-colors shadow-neo-sm"
          >
            <div className="text-[11px] font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1">
              <Lock className="w-3 h-3 text-brand-700" /> Admin
            </div>
            <div className="text-[10px] text-ink-500 dark:text-ink-400">Full System Control</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('payroll.manager@peoplepay360.com')}
            className="p-2 text-left bg-surface-light dark:bg-surface-dark border border-ink-900 dark:border-neutral-700 rounded-neo hover:bg-brand-50 dark:hover:bg-neutral-800 transition-colors shadow-neo-sm"
          >
            <div className="text-[11px] font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-emerald-600" /> Payroll Manager
            </div>
            <div className="text-[10px] text-ink-500 dark:text-ink-400">Payrun & Rules CRUD</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('hr.manager@peoplepay360.com')}
            className="p-2 text-left bg-surface-light dark:bg-surface-dark border border-ink-900 dark:border-neutral-700 rounded-neo hover:bg-brand-50 dark:hover:bg-neutral-800 transition-colors shadow-neo-sm"
          >
            <div className="text-[11px] font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-600" /> HR Manager
            </div>
            <div className="text-[10px] text-ink-500 dark:text-ink-400">Leaves & Contracts</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin('alex.morgan@peoplepay360.com')}
            className="p-2 text-left bg-surface-light dark:bg-surface-dark border border-ink-900 dark:border-neutral-700 rounded-neo hover:bg-brand-50 dark:hover:bg-neutral-800 transition-colors shadow-neo-sm"
          >
            <div className="text-[11px] font-bold text-ink-900 dark:text-ink-100 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-amber-600" /> Alex Morgan
            </div>
            <div className="text-[10px] text-ink-500 dark:text-ink-400">Employee Portal</div>
          </button>
        </div>
      </div>
    </div>
  );
};
