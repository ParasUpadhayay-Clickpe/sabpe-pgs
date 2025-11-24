import * as React from 'react';
import { cn } from '../../lib/utils/cn';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    isHoverable?: boolean;
}

/**
 * Card component used throughout the dashboard for grouping content.
 */
export function Card({ children, className, onClick, isHoverable = false }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                'rounded-2xl border border-gray-100 bg-white/90 p-7 md:p-8 shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900/80',
                isHoverable &&
                'cursor-pointer hover:shadow-lg hover:border-blue-200 hover:scale-[1.01]',
                onClick && 'cursor-pointer',
                className,
            )}
        >
            {children}
        </div>
    );
}


