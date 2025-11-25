'use client';

import { useEffect, useState } from 'react';
import {
    collection,
    getDocs,
    limit,
    query,
    where,
} from 'firebase/firestore';

import { db } from '../../lib/firebase/client';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface Pay10TerminalPaymentProps {
    gatewayId: string;
    utilityId: string;
}

interface Pay10TerminalConfig {
    name: string;
    payloadId: string;
    secretKey: string;
}

async function sha256HexUpper(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
}

function generateRandomOrderId(): string {
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(bytes);
    } else {
        for (let i = 0; i < bytes.length; i += 1) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }

    const randomHex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();

    const timestampPart = Date.now().toString(36).toUpperCase();

    return `ORD_${timestampPart}_${randomHex}`;
}

export function Pay10TerminalPayment({
    gatewayId,
    utilityId,
}: Pay10TerminalPaymentProps) {
    const [terminal, setTerminal] = useState<Pay10TerminalConfig | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadConfig() {
            try {
                const q = query(
                    collection(db, 'gateways', gatewayId, 'terminals'),
                    where('utilityId', '==', utilityId),
                    limit(1),
                );
                const snap = await getDocs(q);

                if (snap.empty) {
                    setError('No terminal configuration found for this service.');
                    return;
                }

                const docSnap = snap.docs[0];
                const data = docSnap.data() as {
                    payloadId?: string;
                    secretKey?: string;
                };

                if (!data.payloadId || !data.secretKey) {
                    setError(
                        'Terminal configuration is incomplete. Please ensure Payload ID and Secret Key are set.',
                    );
                    return;
                }

                setTerminal({
                    name: docSnap.id,
                    payloadId: data.payloadId,
                    secretKey: data.secretKey,
                });
            } catch (err) {
                console.error('Failed to load Pay10 terminal config', err);
                setError('Failed to load terminal configuration.');
            } finally {
                setLoadingConfig(false);
            }
        }

        void loadConfig();
    }, [gatewayId, utilityId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!terminal) return;

        const amountString = amount.trim();
        const numericAmount = Number(amountString);
        if (!numericAmount || numericAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            // Generate random ORDER_ID
            const orderId = generateRandomOrderId();

            // Build RETURN_URL pointing to Next.js callback handler
            const origin =
                typeof window !== 'undefined' ? window.location.origin : '';
            const returnUrl = origin
                ? `${origin}/api/pay10/callback`
                : 'https://sabpe.com/api/pay10/callback';

            // Fixed fields as per your HTML demo
            const params: Record<string, string> = {
                ORDER_ID: orderId,
                AMOUNT: (numericAmount * 100).toString(),
                TXNTYPE: 'SALE',
                CURRENCY_CODE: '356', // INR
                RETURN_URL: returnUrl,
                PAY_ID: terminal.payloadId,
            };

            const sortedKeys = Object.keys(params).sort();
            const concatenated = sortedKeys
                .map((key) => `${key}=${params[key]}`)
                .join('~');
            const stringToHash = concatenated + terminal.secretKey;

            const hash = await sha256HexUpper(stringToHash);

            // Create and submit a temporary form to Pay10 payment URL
            const tempForm = document.createElement('form');
            tempForm.method = 'POST';
            tempForm.action = 'https://secure.pay10.com/pgui/jsp/paymentrequest';
            tempForm.target = '_blank';

            for (const [key, value] of Object.entries(params)) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = value;
                tempForm.appendChild(input);
            }

            const hashInput = document.createElement('input');
            hashInput.type = 'hidden';
            hashInput.name = 'HASH';
            hashInput.value = hash;
            tempForm.appendChild(hashInput);

            document.body.appendChild(tempForm);
            tempForm.submit();
            document.body.removeChild(tempForm);
        } catch (err) {
            console.error('Failed to initiate Pay10 payment', err);
            setError('Failed to initiate payment. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <Card className="max-w-md">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                Pay10 Payment
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Terminal:{' '}
                <span className="font-medium">
                    {terminal?.name ?? 'Loading...'}
                </span>
            </p>

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
                            htmlFor="pay10-amount"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                            Amount (INR)
                        </label>
                        <input
                            id="pay10-amount"
                            type="number"
                            min={1}
                            step="0.01"
                            required
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Redirecting…' : 'Pay with Pay10'}
                        </Button>
                    </div>
                </form>
            )}
        </Card>
    );
}


