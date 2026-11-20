import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-xs sm:text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs active:scale-95 border border-emerald-500/40',
        primary:
          'bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-xs active:scale-95 border border-emerald-500/40',
        destructive:
          'bg-[#C11221] hover:bg-[#a50f1c] text-white font-bold shadow-xs active:scale-95 border border-red-700/50',
        secondary:
          'bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-stone-800 dark:text-zinc-200 font-semibold border border-stone-200/90 dark:border-white/10 active:scale-95',
        outline:
          'border border-stone-300 dark:border-white/20 bg-transparent hover:bg-stone-100 dark:hover:bg-white/[0.06] text-stone-800 dark:text-zinc-200 font-medium active:scale-95',
        ghost:
          'hover:bg-stone-100 dark:hover:bg-white/[0.08] text-stone-700 dark:text-zinc-300 active:scale-95',
        success:
          'bg-emerald-600 hover:bg-emerald-500 text-white font-bold active:scale-95 border border-emerald-500/40',
      },
      size: {
        default: 'h-9 px-4 py-2 rounded-xl',
        sm: 'h-7 px-2.5 text-xs rounded-lg',
        lg: 'h-11 px-5 text-sm sm:text-base rounded-2xl',
        icon: 'h-9 w-9 p-0 rounded-xl',
        'icon-sm': 'h-7 w-7 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
