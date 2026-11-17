import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-xs font-bold transition-colors select-none',
  {
    variants: {
      variant: {
        default:
          'bg-stone-200/80 dark:bg-white/10 text-stone-800 dark:text-zinc-200 border border-stone-300/80 dark:border-white/15',
        primary:
          'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30',
        amber:
          'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30',
        warning:
          'bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/30',
        destructive:
          'bg-[#C11221] text-white border border-red-700/50 shadow-xs',
        danger:
          'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30',
        success:
          'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30',
        info:
          'bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30',
        purple:
          'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30',
        outline:
          'border border-stone-300 dark:border-white/20 text-stone-700 dark:text-zinc-300 bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
