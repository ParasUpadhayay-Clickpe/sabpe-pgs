'use client';

import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

import type { Utility, UtilityType } from '../../lib/types/utility.types';
import type { PaymentGateway } from '../../lib/types/gateway.types';
import { Card } from '../ui/card';

interface UtilityGridProps {
    utilities: Utility[];
    gateway: PaymentGateway;
    showRemove?: boolean;
    onRemoveTerminal?: (utilityId: UtilityType) => void;
}

/**
 * Grid of utilities for a selected gateway.
 */
export function UtilityGrid({ utilities, gateway, showRemove, onRemoveTerminal }: UtilityGridProps) {
    const router = useRouter();

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {utilities.map((utility) => {
                const Icon =
                    Icons[utility.icon as keyof typeof Icons] ?? Icons.CircleDot;

                return (
                    <Card
                        key={utility.id}
                        isHoverable
                        onClick={() => router.push(`/${gateway}/${utility.id}`)}
                        className="group relative text-center"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="rounded-full bg-blue-50 p-4 transition-colors group-hover:bg-blue-100 dark:bg-slate-800/70 dark:group-hover:bg-slate-700">
                                <Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="text-base font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-slate-50 dark:group-hover:text-blue-400">
                                    {utility.displayName}
                                </h4>
                                <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                                    {utility.description}
                                </p>
                            </div>
                            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-slate-800 dark:text-slate-300">
                                {utility.category}
                            </span>
                            {showRemove && onRemoveTerminal && (
                                <button
                                    type="button"
                                    aria-label="Remove terminal"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        const confirmed = window.confirm(
                                            `Remove this terminal for ${utility.displayName}?`,
                                        );
                                        if (confirmed) {
                                            onRemoveTerminal(utility.id);
                                        }
                                    }}
                                    className="absolute right-3 top-3 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-red-400"
                                >
                                    <Icons.X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}


