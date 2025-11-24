'use client';

import { useMemo, useState } from 'react';

import type { PaymentGateway } from '../../lib/types/gateway.types';
import type { Utility, UtilityType } from '../../lib/types/utility.types';
import { UtilityGrid } from './utility-grid';
import { Button } from '../ui/button';

interface GatewayTerminalsProps {
    gatewayId: PaymentGateway;
    allUtilities: Utility[];
    initialUtilityIds: UtilityType[];
}

/**
 * Client-side manager for gateway terminals (utilities).
 * Lets you add/remove which utilities are active for a gateway.
 */
export function GatewayTerminals({
    gatewayId,
    allUtilities,
    initialUtilityIds,
}: GatewayTerminalsProps) {
    const [terminalIds, setTerminalIds] =
        useState<UtilityType[]>(initialUtilityIds);
    const [selectedToAdd, setSelectedToAdd] = useState<UtilityType | ''>('');

    const terminals = useMemo(
        () => allUtilities.filter((utility) => terminalIds.includes(utility.id)),
        [allUtilities, terminalIds],
    );

    const addableUtilities = useMemo(
        () => allUtilities.filter((utility) => !terminalIds.includes(utility.id)),
        [allUtilities, terminalIds],
    );

    const handleRemoveTerminal = (utilityId: UtilityType) => {
        setTerminalIds((current) =>
            current.filter((existingId) => existingId !== utilityId),
        );
    };

    const handleAddTerminal = (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedToAdd) return;

        setTerminalIds((current) =>
            current.includes(selectedToAdd) ? current : [...current, selectedToAdd],
        );
        setSelectedToAdd('');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Terminals
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Enable or disable which services (utility, electricity, FASTag,
                        education) are active for this gateway.
                    </p>
                </div>

                {addableUtilities.length > 0 && (
                    <form
                        onSubmit={handleAddTerminal}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <select
                            value={selectedToAdd}
                            onChange={(event) =>
                                setSelectedToAdd(event.target.value as UtilityType)
                            }
                            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                            <option value="">Add terminal…</option>
                            {addableUtilities.map((utility) => (
                                <option key={utility.id} value={utility.id}>
                                    {utility.displayName}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" size="sm" disabled={!selectedToAdd}>
                            Add
                        </Button>
                    </form>
                )}
            </div>

            {terminals.length > 0 ? (
                <UtilityGrid
                    utilities={terminals}
                    gateway={gatewayId}
                    showRemove
                    onRemoveTerminal={handleRemoveTerminal}
                />
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    No terminals configured yet. Use the selector above to add utilities
                    (like FASTag, electricity, or education) as active terminals for this
                    gateway.
                </div>
            )}
        </div>
    );
}


