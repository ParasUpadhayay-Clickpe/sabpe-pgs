import type { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

/**
 * Dashboard layout wrapper for all dashboard routes.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <header className="border-b border-slate-100 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                        ClickPe · Payment Dashboard
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                        Multi-Gateway Control Center
                    </span>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-12">{children}</main>
        </div>
    );
}


