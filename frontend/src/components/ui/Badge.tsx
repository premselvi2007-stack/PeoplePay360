import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'active' | 'draft' | 'running' | 'paid' | 'validated' | 'warning' | 'danger' | 'neutral' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
}) => {
  const baseStyles = 'inline-flex items-center font-medium uppercase tracking-wider rounded border';

  const variants = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    running: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    paid: 'bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-700 dark:text-white dark:border-emerald-900',
    validated: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    draft: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    warning: 'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700',
    danger: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    brand: 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800',
    neutral: 'bg-ink-100 text-ink-700 border-ink-300 dark:bg-neutral-800 dark:text-ink-300 dark:border-neutral-700',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.5 font-semibold',
    md: 'text-xs px-2 py-0.5 font-semibold',
  };

  return (
    <span className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
};
