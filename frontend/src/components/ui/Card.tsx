import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface-light border border-ink-900 rounded-neo shadow-neo p-5 dark:bg-surface-dark dark:border-neutral-700 dark:shadow-neo-dark transition-all',
          hoverable && 'hover:-translate-y-0.5 hover:shadow-neo-lg dark:hover:shadow-neo-dark-lg cursor-pointer',
          className,
        ),
      )}
      {...props}
    >
      {children}
    </div>
  );
};
