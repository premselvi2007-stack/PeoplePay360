import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-light dark:bg-canvas-dark">
        <div className="w-8 h-8 border-4 border-brand-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex flex-col justify-between p-4 sm:p-6 transition-colors duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-neo bg-brand-700 border-2 border-ink-900 flex items-center justify-center text-white font-black shadow-neo-sm">
            P
          </div>
          <span className="font-extrabold text-base tracking-tight text-ink-900 dark:text-ink-100">
            PeoplePay<span className="text-brand-700 dark:text-brand-400">360</span>
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-neo border border-ink-900 dark:border-neutral-700 hover:bg-ink-100 dark:hover:bg-neutral-800 text-ink-800 dark:text-ink-200 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Form Container */}
      <div className="flex items-center justify-center py-8">
        <Outlet />
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-ink-500 dark:text-ink-400">
        <p>PeoplePay360 Platform • Odoo Hackathon 2026</p>
      </div>
    </div>
  );
};
