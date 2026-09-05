import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-surface-light dark:bg-surface-dark border border-ink-900 dark:border-neutral-700 rounded-neo overflow-hidden p-6 space-y-3">
        <div className="h-6 bg-ink-200 dark:bg-neutral-800 rounded animate-pulse w-1/3"></div>
        <div className="h-10 bg-ink-100 dark:bg-neutral-800/60 rounded animate-pulse"></div>
        <div className="h-10 bg-ink-100 dark:bg-neutral-800/60 rounded animate-pulse"></div>
        <div className="h-10 bg-ink-100 dark:bg-neutral-800/60 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={twMerge('w-full overflow-x-auto border border-ink-900 dark:border-neutral-700 rounded-neo bg-surface-light dark:bg-surface-dark shadow-neo-sm', className)}>
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-canvas-light dark:bg-neutral-900 border-b border-ink-900 dark:border-neutral-700 text-[11px] font-bold uppercase tracking-wider text-ink-700 dark:text-ink-300">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={clsx(
                  'px-4 py-3',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-200 dark:divide-neutral-800">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-ink-500 dark:text-ink-400 font-medium"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={clsx(
                  'transition-colors',
                  onRowClick
                    ? 'cursor-pointer hover:bg-brand-50/50 dark:hover:bg-neutral-800/60'
                    : 'hover:bg-ink-50/50 dark:hover:bg-neutral-800/30',
                )}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={clsx(
                      'px-4 py-3 text-ink-900 dark:text-ink-100',
                      col.align === 'right' && 'text-right font-mono',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : col.accessor
                        ? (row[col.accessor] as any)
                        : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
