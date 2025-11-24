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
    payloadId: string;
    secretKey: string;
    encryptionKey: string;
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
    const [terminalName, setTerminalName] = useState<string>('');

    // Temp credential fields captured when adding a terminal
    const [payloadId, setPayloadId] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [encryptionKey, setEncryptionKey] = useState('');
    const [savedSummary, setSavedSummary] = useState<string | null>(null);

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
                    configs.push({
                        id: docSnap.id,
                        utilityId: data.utilityId as UtilityType,
                        payloadId: data.payloadId ?? '',
                        secretKey: data.secretKey ?? '',
                        encryptionKey: data.encryptionKey ?? '',
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

    const addableUtilities = useMemo(
        () => allUtilities.filter((utility) => !terminalIds.includes(utility.id)),
        [allUtilities, terminalIds],
    );

    const handleRemoveTerminal = (utilityId: UtilityType) => {
        const nextConfigs = terminalConfigs.filter(
            (config) => config.utilityId !== utilityId,
        );
        setTerminalConfigs(nextConfigs);

        void deleteDoc(doc(db, 'gateways', gatewayId, 'terminals', utilityId));
    };

    const handleAddTerminal = (event: React.FormEvent) => {
        event.preventDefault();
        if (
            !terminalName.trim() ||
            !payloadId ||
            !secretKey ||
            !encryptionKey
        ) {
            // All fields are required to add a terminal
            return;
        }

        const trimmedName = terminalName.trim();

        // Automatically pick the next available utility for this terminal
        const nextUtility = addableUtilities[0];
        if (!nextUtility) {
            return;
        }

        const newConfig: PersistedTerminalConfig = {
            id: trimmedName,
            utilityId: nextUtility.id,
            payloadId,
            secretKey,
            encryptionKey,
        };

        const nextConfigs = [
            ...terminalConfigs.filter(
                (config) => config.utilityId !== nextUtility.id,
            ),
            newConfig,
        ];

        setTerminalConfigs(nextConfigs);

        // Persist this terminal in Firestore under the terminal name
        void setDoc(
            doc(db, 'gateways', gatewayId, 'terminals', trimmedName),
            newConfig,
        );

        setSavedSummary(
            `Terminal: ${trimmedName} (${nextUtility.id}), Payload ID: ${payloadId}, Secret Key: ${secretKey}, MH Encryption Key: ${encryptionKey}`,
        );

        // Clear form
        setTerminalName('');
        setPayloadId('');
        setSecretKey('');
        setEncryptionKey('');
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        Terminals
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Configure named terminals (like FASTag UAT, Electricity PROD) for
                        this gateway with their credentials.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3">
                    {addableUtilities.length > 0 && (
                        <form
                            onSubmit={handleAddTerminal}
                            className="grid w-full gap-3 md:grid-cols-5 lg:grid-cols-6"
                        >
                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Terminal name
                                </label>
                                <input
                                    type="text"
                                    value={terminalName}
                                    onChange={(event) => setTerminalName(event.target.value)}
                                    placeholder="e.g. FASTag UAT"
                                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                {/* Service is chosen automatically based on remaining supported utilities */}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Payload ID
                                </label>
                                <input
                                    type="text"
                                    value={payloadId}
                                    onChange={(event) => setPayloadId(event.target.value)}
                                    placeholder="Payload-ID"
                                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                    Secret Key (Salt)
                                </label>
                                <input
                                    type="text"
                                    value={secretKey}
                                    onChange={(event) => setSecretKey(event.target.value)}
                                    placeholder="Salt"
                                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                                    MH Encryption Key
                                </label>
                                <input
                                    type="text"
                                    value={encryptionKey}
                                    onChange={(event) => setEncryptionKey(event.target.value)}
                                    placeholder="EncryptionKkey"
                                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                                    required
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    type="submit"
                                    size="sm"
                                    className="w-full"
                                    disabled={
                                        !terminalName.trim() ||
                                        !payloadId ||
                                        !secretKey ||
                                        !encryptionKey
                                    }
                                >
                                    Add terminal
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {savedSummary && (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    <span className="font-semibold">Current temp config:</span>{' '}
                    <span className="font-mono">{savedSummary}</span>
                </div>
            )}

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


