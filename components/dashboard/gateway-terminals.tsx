'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
} from 'firebase/firestore';

import type { PaymentGateway } from '../../lib/types/gateway.types';
import type { Utility, UtilityType } from '../../lib/types/utility.types';
import { UtilityGrid } from './utility-grid';
import { Button } from '../ui/button';
import { db } from '../../lib/firebase/client';

interface GatewayTerminalsProps {
    gatewayId: PaymentGateway;
    allUtilities: Utility[];
    initialUtilityIds: UtilityType[];
}

interface PersistedTerminalConfig {
    id: string; // terminal name / document id
    utilityId: UtilityType;
}

/**
 * Client-side manager for gateway terminals (utilities).
 * Lets you add/remove which utilities are active for a gateway and
 * temporarily capture credential fields when adding a terminal.
 */
export function GatewayTerminals({
    gatewayId,
    allUtilities,
    initialUtilityIds,
}: GatewayTerminalsProps) {
    const [terminalConfigs, setTerminalConfigs] = useState<PersistedTerminalConfig[]>([]);

    // Load persisted terminals (if any) for this gateway from Firestore
    useEffect(() => {
        async function load() {
            try {
                const snap = await getDocs(
                    collection(db, 'gateways', gatewayId, 'terminals'),
                );
                const configs: PersistedTerminalConfig[] = [];
                snap.forEach((docSnap) => {
                    const data = docSnap.data() as Partial<PersistedTerminalConfig>;
                    if (!data.utilityId) return;
                    console.log(data)
                    configs.push({
                        id: docSnap.id,
                        utilityId: data.utilityId as UtilityType,
                    });
                });
                setTerminalConfigs(configs);
            } catch (error) {
                console.error('Failed to load terminals from Firestore', error);
            }
        }

        void load();
    }, [gatewayId, initialUtilityIds]);

    const terminalIds = useMemo(
        () => terminalConfigs.map((config) => config.utilityId),
        [terminalConfigs],
    );

    const terminals = useMemo(
        () => allUtilities.filter((utility) => terminalIds.includes(utility.id)),
        [allUtilities, terminalIds],
    );

    const handleRemoveTerminal = (utilityId: UtilityType) => {
        const nextConfigs = terminalConfigs.filter(
            (config) => config.utilityId !== utilityId,
        );
        setTerminalConfigs(nextConfigs);

        void deleteDoc(doc(db, 'gateways', gatewayId, 'terminals', utilityId));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Terminals
                    </h2>
                </div>
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


