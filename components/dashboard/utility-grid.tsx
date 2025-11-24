'use client';

import { useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';

import type { Utility, UtilityType } from '../../lib/types/utility.types';
import type { PaymentGateway } from '../../lib/types/gateway.types';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface UtilityGridProps {
    utilities: Utility[];
    gateway: PaymentGateway;
    showRemove?: boolean;
    onRemoveTerminal?: (utilityId: UtilityType) => void;
}

/**
 * Grid of utilities for a selected gateway.
 * Each utility (terminal) can be opened in UAT or PROD mode.
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
                        className="group text-center"
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

                            <div className="mt-2 flex gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() =>
                                        router.push(`/${gateway}/${utility.id}?mode=uat`)
                                    }
                                >
                                    UAT
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={() =>
                                        router.push(`/${gateway}/${utility.id}?mode=prod`)
                                    }
                                >
                                    PROD
                                </Button>
                            </div>

                            {showRemove && onRemoveTerminal && (
                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onRemoveTerminal(utility.id);
                                    }}
                                    className="mt-1 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    Remove terminal
                                </button>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}


