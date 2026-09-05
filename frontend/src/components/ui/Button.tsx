import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  icon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:shadow-none focus-visible:outline-none';

  const variants = {
    primary:
      'bg-brand-700 text-white border border-ink-900 shadow-neo hover:bg-brand-800 dark:bg-brand-600 dark:hover:bg-brand-700 dark:border-neutral-700 dark:shadow-neo-dark',
    secondary:
      'bg-surface-light text-ink-900 border border-ink-900 shadow-neo hover:bg-ink-100 dark:bg-surface-dark dark:text-ink-100 dark:border-neutral-700 dark:hover:bg-neutral-800 dark:shadow-neo-dark',
    outline:
      'bg-transparent text-ink-800 border border-ink-400 hover:border-ink-900 hover:bg-ink-100 dark:text-ink-200 dark:border-neutral-600 dark:hover:bg-neutral-800',
    danger:
      'bg-red-600 text-white border border-ink-900 shadow-neo hover:bg-red-700 dark:border-neutral-700 dark:shadow-neo-dark',
    success:
      'bg-emerald-600 text-white border border-ink-900 shadow-neo hover:bg-emerald-700 dark:border-neutral-700 dark:shadow-neo-dark',
    ghost:
      'bg-transparent text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-neutral-800',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 rounded-neo gap-1.5',
    md: 'text-sm px-4 py-2 rounded-neo gap-2',
    lg: 'text-base px-5 py-2.5 rounded-neo gap-2.5 font-semibold',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
};
