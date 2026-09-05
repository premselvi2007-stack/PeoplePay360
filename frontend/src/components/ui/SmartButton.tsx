import React from 'react';
import { clsx } from 'clsx';

export interface SmartButtonProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export const SmartButton: React.FC<SmartButtonProps> = ({
  icon,
  count,
  label,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-4 py-2.5 rounded-neo border transition-all text-left group',
        isActive
          ? 'bg-brand-700 text-white border-ink-900 shadow-neo dark:bg-brand-600 dark:border-neutral-700'
          : 'bg-surface-light text-ink-900 border-ink-900 hover:bg-ink-50 shadow-neo-sm dark:bg-surface-dark dark:text-ink-100 dark:border-neutral-700 dark:hover:bg-neutral-800',
      )}
    >
      <div
        className={clsx(
          'p-2 rounded-neo transition-colors',
          isActive
            ? 'bg-white/20 text-white'
            : 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300',
        )}
      >
        {icon}
      </div>
      <div>
        <div className="text-base font-bold leading-none font-mono">{count}</div>
        <div
          className={clsx(
            'text-[11px] font-semibold uppercase tracking-wider mt-0.5',
            isActive ? 'text-white/80' : 'text-ink-500 dark:text-ink-400',
          )}
        >
          {label}
        </div>
      </div>
    </button>
  );
};
