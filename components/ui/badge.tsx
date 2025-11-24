import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils/cn';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm',
    {
        variants: {
            variant: {
                default: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
                success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200',
                secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> { }

/**
 * Badge component for status indicators and labels.
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <span className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}


