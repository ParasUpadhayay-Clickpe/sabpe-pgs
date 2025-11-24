import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:shadow-md',
    {
        variants: {
            variant: {
                primary:
                    'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 text-white hover:from-blue-700 hover:via-indigo-600 hover:to-sky-600 focus-visible:ring-blue-500 dark:from-blue-500 dark:via-indigo-400 dark:to-sky-400',
                secondary:
                    'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
                outline:
                    'border-2 border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-400 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800',
                ghost:
                    'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
            },
            size: {
                sm: 'h-9 px-3 text-sm',
                md: 'h-11 px-5 text-base',
                lg: 'h-13 px-7 text-lg',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

/**
 * Reusable button component following the design system.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(buttonVariants({ variant, size }), className)}
                {...props}
            />
        );
    },
);

Button.displayName = 'Button';


