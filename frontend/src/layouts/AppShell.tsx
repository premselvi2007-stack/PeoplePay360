import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  FileText,
  Clock,
  Calendar,
  DollarSign,
  BarChart3,
  Shield,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  LayoutDashboard,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Badge } from '../components/ui/Badge';
import { CookieBanner } from '../components/ui/CookieBanner';
import { api } from '../lib/api';
import { useToast } from '../components/ui/Toast';

export const AppShell: React.FC = () => {
  const { user, logout, isAdmin, isHRManager, isPayrollUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPunching, setIsPunching] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleQuickCheckIn = async () => {
    try {
      setIsPunching(true);
      await api.post('/attendance/check-in', { timestamp: new Date().toISOString() });
      toast.success('Punched In Successfully', `Recorded at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      toast.error('Check-in failed', err.message);
    } finally {
      setIsPunching(false);
    }
  };

  const handleQuickCheckOut = async () => {
    try {
      setIsPunching(true);
      await api.post('/attendance/check-out', { timestamp: new Date().toISOString() });
      toast.success('Punched Out Successfully', `Recorded at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      toast.error('Check-out failed', err.message);
    } finally {
      setIsPunching(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Employees', path: '/employees', icon: <Users className="w-4 h-4" />, hide: !isHRManager && !isAdmin },
    { name: 'Contracts', path: '/contracts', icon: <FileText className="w-4 h-4" />, hide: !isHRManager && !isAdmin },
    { name: 'Schedules', path: '/schedules', icon: <Layers className="w-4 h-4" />, hide: !isHRManager && !isAdmin },
    { name: 'Attendance', path: '/attendance', icon: <Clock className="w-4 h-4" /> },
    { name: 'Time Off', path: '/time-off', icon: <Calendar className="w-4 h-4" /> },
    { name: 'Payroll', path: '/payroll', icon: <DollarSign className="w-4 h-4" />, hide: !isPayrollUser && !isAdmin },
    { name: 'Reports', path: '/reports', icon: <BarChart3 className="w-4 h-4" />, hide: !isPayrollUser && !isAdmin },
    { name: 'Users & Roles', path: '/users', icon: <Shield className="w-4 h-4" />, hide: !isAdmin },
  ].filter((item) => !item.hide);

  // Generate Breadcrumbs from current pathname
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((seg, idx) => {
    const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
    const name = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    return { name, url, isLast: idx === pathSegments.length - 1 };
  });

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex flex-col font-sans transition-colors duration-150">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-brand-700 focus:text-white focus:px-3 focus:py-1.5 focus:rounded-neo focus:shadow-neo"
      >
        Skip to main content
      </a>

      {/* Top Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface-light dark:bg-surface-dark border-b-2 border-ink-900 dark:border-neutral-700 px-4 lg:px-6 h-16 flex items-center justify-between shadow-sm">
        {/* Left: Brand Logo & App Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-neo border border-ink-900 dark:border-neutral-700 hover:bg-ink-100 dark:hover:bg-neutral-800"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-neo bg-brand-700 border-2 border-ink-900 flex items-center justify-center text-white font-black shadow-neo-sm group-hover:bg-brand-800 transition-colors">
              P
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-ink-900 dark:text-ink-100">
                  PeoplePay<span className="text-brand-700 dark:text-brand-400">360</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 rounded border border-brand-300 dark:border-brand-800 font-bold">
                  Odoo '26
                </span>
              </div>
              <p className="text-[10px] text-ink-500 dark:text-ink-400 font-medium leading-none hidden sm:block">
                Integrated HR & Payroll
              </p>
            </div>
          </NavLink>
        </div>

        {/* Right: Quick Punch, Role Badge, Theme Switcher, User Menu */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Quick Punch In / Out Actions */}
          <div className="hidden md:flex items-center gap-1.5 bg-canvas-light dark:bg-neutral-900 p-1 rounded-neo border border-ink-300 dark:border-neutral-700">
            <button
              onClick={handleQuickCheckIn}
              disabled={isPunching}
              className="text-[11px] font-bold px-2.5 py-1 bg-emerald-600 text-white rounded border border-emerald-700 hover:bg-emerald-700 shadow-neo-sm active:translate-y-0.5"
            >
              Punch In
            </button>
            <button
              onClick={handleQuickCheckOut}
              disabled={isPunching}
              className="text-[11px] font-bold px-2.5 py-1 bg-ink-200 text-ink-800 dark:bg-neutral-800 dark:text-ink-200 rounded hover:bg-ink-300 dark:hover:bg-neutral-700 border border-ink-400 dark:border-neutral-600"
            >
              Punch Out
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-neo border border-ink-900 dark:border-neutral-700 hover:bg-ink-100 dark:hover:bg-neutral-800 text-ink-800 dark:text-ink-200 transition-colors"
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-ink-200 dark:border-neutral-700">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-ink-900 dark:text-ink-100 leading-tight">
                {user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email}
              </p>
              <Badge variant="brand" size="sm" className="mt-0.5">
                {user?.role?.replace(/_/g, ' ')}
              </Badge>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-neo border border-ink-900 dark:border-neutral-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-ink-700 dark:text-ink-300 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-60 bg-surface-light dark:bg-surface-dark border-r-2 border-ink-900 dark:border-neutral-700 p-4 shrink-0">
          <nav className="space-y-1 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-neo border text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-700 text-white border-ink-900 shadow-neo-sm dark:bg-brand-600 dark:border-neutral-700'
                      : 'text-ink-700 dark:text-ink-300 border-transparent hover:border-ink-400 hover:bg-ink-100 dark:hover:bg-neutral-800 dark:hover:border-neutral-700'
                  }`
                }
              >
                {item.icon}
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer Info */}
          <div className="pt-4 mt-4 border-t border-ink-200 dark:border-neutral-800">
            <div className="p-3 bg-canvas-light dark:bg-neutral-900 border border-ink-300 dark:border-neutral-700 rounded-neo">
              <div className="flex items-center gap-1.5 text-xs font-bold text-ink-900 dark:text-ink-100">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Odoo Hackathon '26</span>
              </div>
              <p className="text-[11px] text-ink-500 dark:text-ink-400 mt-1">
                Connected HR & Payroll Workflow
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div
              className="fixed inset-0 bg-ink-900/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative w-64 bg-surface-light dark:bg-surface-dark border-r-2 border-ink-900 dark:border-neutral-700 p-4 flex flex-col z-50 h-full animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-ink-200 dark:border-neutral-800">
                <span className="font-bold text-sm text-ink-900 dark:text-ink-100">Menu</span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-neo border border-ink-900 dark:border-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="space-y-1 flex-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-neo border text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-brand-700 text-white border-ink-900 shadow-neo-sm dark:bg-brand-600 dark:border-neutral-700'
                          : 'text-ink-700 dark:text-ink-300 border-transparent hover:bg-ink-100 dark:hover:bg-neutral-800'
                      }`
                    }
                  >
                    {item.icon}
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main id="main-content" className="flex-1 flex flex-col overflow-y-auto max-w-full">
          {/* Breadcrumbs Bar */}
          {breadcrumbs.length > 0 && (
            <div className="bg-surface-light/60 dark:bg-surface-dark/60 border-b border-ink-200 dark:border-neutral-800 px-4 lg:px-8 py-2.5 flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
              <NavLink to="/dashboard" className="hover:text-brand-700 dark:hover:text-brand-400">
                Home
              </NavLink>
              {breadcrumbs.map((b) => (
                <React.Fragment key={b.url}>
                  <span>/</span>
                  {b.isLast ? (
                    <span className="font-bold text-ink-900 dark:text-ink-100">{b.name}</span>
                  ) : (
                    <NavLink to={b.url} className="hover:text-brand-700 dark:hover:text-brand-400">
                      {b.name}
                    </NavLink>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Routed Views */}
          <div className="flex-1 p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <CookieBanner />
    </div>
  );
};
