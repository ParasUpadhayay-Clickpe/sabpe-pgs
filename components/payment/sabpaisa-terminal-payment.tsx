'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';

import { submitPaymentForm } from 'sabpaisa-pg-dev';

import { db } from '../../lib/firebase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface SabPaisaTerminalPaymentProps {
    gatewayId: string;
    utilityId: string;
    mode: 'uat' | 'prod';
}

interface SabPaisaTerminalConfig {
    name: string;
    clientCode: string;
    transUserName: string;
    transUserPassword: string;
    authKey: string;
    authIV: string;
    channelId?: string;
    url?: string;
}

interface SabPaisaFormData {
    clientCode: string;
    transUserName: string;
    transUserPassword: string;
    authKey: string;
    authIV: string;
    callbackUrl: string;
    clientTxnId: string;
    payerName: string;
    payerEmail: string;
    payerMobile: string;
    amount: string;
    channelId: string;
    url: string;
}

export function SabPaisaTerminalPayment({
    gatewayId,
    utilityId,
    mode,
}: SabPaisaTerminalPaymentProps) {
    const [terminals, setTerminals] = useState<SabPaisaTerminalConfig[]>([]);
    const [terminal, setTerminal] = useState<SabPaisaTerminalConfig | null>(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [amount, setAmount] = useState<string>('');
    const [payerName, setPayerName] = useState<string>('');
    const [payerEmail, setPayerEmail] = useState<string>('');
    const [payerMobile, setPayerMobile] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function loadConfig() {
            try {
                const q = query(
                    collection(db, 'gateways', gatewayId, 'terminals'),
                    where('utilityId', '==', utilityId),
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    setError('No SabPaisa terminal configuration found for this service.');
                    return;
                }
                const loaded: SabPaisaTerminalConfig[] = [];

                snap.forEach((docSnap) => {
                    const data = docSnap.data() as Partial<SabPaisaTerminalConfig>;

                    if (
                        !data.clientCode ||
                        !data.transUserName ||
                        !data.transUserPassword ||
                        !data.authKey ||
                        !data.authIV
                    ) {
                        console.warn(
                            'Skipping SabPaisa terminal with incomplete config:',
                            docSnap.id,
                        );
                        return;
                    }

                    loaded.push({
                        name: docSnap.id,
                        clientCode: data.clientCode,
                        transUserName: data.transUserName,
                        transUserPassword: data.transUserPassword,
                        authKey: data.authKey,
                        authIV: data.authIV,
                        channelId: data.channelId,
                        url: data.url,
                    });
                });

                if (loaded.length === 0) {
                    setError(
                        'No SabPaisa terminals with complete configuration found for this service.',
                    );
                    return;
                }

                setTerminals(loaded);
                setTerminal(loaded[0]);
            } catch (err) {
                console.error('Failed to load SabPaisa terminal config', err);
                setError('Failed to load terminal configuration.');
            } finally {
                setLoadingConfig(false);
            }
        }

        void loadConfig();
    }, [gatewayId, utilityId]);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!terminal) return;

        const amountString = amount.trim();

        const amountPattern = /^\d+(\.\d{1,2})?$/;
        if (!amountPattern.test(amountString)) {
            setError('Please enter a valid amount (up to 2 decimal places).');
            return;
        }

        const numericAmount = Number(amountString);
        if (!numericAmount || numericAmount < 10) {
            setError('Minimum payment amount is ₹10.');
            return;
        }

        if (!payerName.trim() || !payerEmail.trim() || !payerMobile.trim()) {
            setError('Please fill in payer name, email, and mobile.');
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const origin =
                typeof window !== 'undefined' ? window.location.origin : '';

            // TODO: Point this to a dedicated SabPaisa result page when you
            // want to parse and show detailed transaction status.
            const callbackUrl = origin
                ? `${origin}/payment/result`
                : 'https://sabpe.com/payment/result';

            const clientTxnId = `SP_${Date.now().toString(36).toUpperCase()}`;

            const finalFormData: SabPaisaFormData = {
                clientCode: terminal.clientCode,
                transUserName: terminal.transUserName,
                transUserPassword: terminal.transUserPassword,
                authKey: terminal.authKey,
                authIV: terminal.authIV,
                callbackUrl,
                clientTxnId,
                payerName: payerName.trim(),
                payerEmail: payerEmail.trim(),
                payerMobile: payerMobile.trim(),
                amount: amountString,
                channelId: terminal.channelId ?? 'npm',
                url:
                    terminal.url ??
                    'https://secure.sabpaisa.in/SabPaisa/sabPaisaInit?v=1',
            };

            void submitPaymentForm({
                ...finalFormData,
                env,
            });
        } catch (err) {
            console.error('Failed to initiate SabPaisa payment', err);
            setError(
                'Failed to initiate SabPaisa payment. Please verify that authKey and authIV are exactly as provided by SabPaisa (base64 AES key and IV).',
            );
        } finally {
            setSubmitting(false);
        }
    };
    // Always use SabPaisa production endpoint for this dashboard.
    const env: 'prod' = 'prod';

    return (
        <Card className="max-w-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                SabPaisa Payment
            </h2>
            {terminals.length > 0 && (
                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p className="font-medium text-slate-700 dark:text-slate-200">
                        Available terminals ({terminals.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {terminals.map((t) => (
                            <span
                                key={t.name}
                                className={`rounded-full border px-3 py-1 text-xs ${terminal?.name === t.name
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/40 dark:text-blue-200'
                                        : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
                                    }`}
                            >
                                {t.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {loadingConfig && (
                <p className="mt-4 text-sm text-slate-500">Loading terminal…</p>
            )}

            {error && (
                <p className="mt-4 text-sm text-red-500" aria-live="polite">
                    {error}
                </p>
            )}

            {!loadingConfig && terminal && !error && (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div>
                        <label
                            htmlFor="sabpaisa-amount"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            Amount (INR)
                        </label>
                        <input
                            id="sabpaisa-amount"
                            type="number"
                            min={10}
                            step="0.01"
                            required
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label
                                htmlFor="sabpaisa-name"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                            >
                                Payer name
                            </label>
                            <input
                                id="sabpaisa-name"
                                type="text"
                                required
                                value={payerName}
                                onChange={(event) => setPayerName(event.target.value)}
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="sabpaisa-email"
                                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                            >
                                Payer email
                            </label>
                            <input
                                id="sabpaisa-email"
                                type="email"
                                required
                                value={payerEmail}
                                onChange={(event) => setPayerEmail(event.target.value)}
                                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="sabpaisa-mobile"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            Payer mobile
                        </label>
                        <input
                            id="sabpaisa-mobile"
                            type="tel"
                            required
                            value={payerMobile}
                            onChange={(event) => setPayerMobile(event.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Preparing payment…' : 'Pay with SabPaisa'}
                        </Button>
                    </div>
                </form>
            )}

        </Card>
    );
}



