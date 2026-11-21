import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-xl border border-stone-200/90 dark:border-white/10 bg-stone-100 dark:bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-emerald-600 focus-visible:ring-1 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
