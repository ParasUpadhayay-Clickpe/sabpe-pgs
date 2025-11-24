'use client';

import * as React from 'react';
import { useState } from 'react';

import { Button } from '../ui/button';

type PaymentMode = 'uat' | 'prod';

interface PaymentWrapperProps {
    gateway: string;
    utility: string;
    mode: PaymentMode;
}

/**
 * Wrapper component for payment flows.
 * Currently shows a placeholder and a basic form; you can later plug in actual payment SDKs.
 */
export function PaymentWrapper({ gateway, utility, mode }: PaymentWrapperProps) {
    const [amount, setAmount] = useState<string>('');
    const [customerId, setCustomerId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(`/api/payment/${gateway}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    utility,
                    amount: Number(amount),
                    customerId,
                    mode,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setMessage(data.error ?? 'Payment initialization failed');
                return;
            }

            // Here you will later use data.credentials and data.context
            setMessage(
                `Payment (${mode.toUpperCase()}) initialized successfully. Plug in PG SDK here.`,
            );
        } catch (error) {
            setMessage('Something went wrong while initializing the payment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
                Enter payment details
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                Gateway: <span className="font-medium">{gateway}</span> | Utility:{' '}
                <span className="font-medium">{utility}</span> | Mode:{' '}
                <span className="font-semibold uppercase">{mode}</span>
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                    <label
                        htmlFor="amount"
                        className="block text-sm font-medium text-gray-700 dark:text-slate-200"
                    >
                        Amount
                    </label>
                    <input
                        id="amount"
                        type="number"
                        min={1}
                        required
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    />
                </div>

                <div>
                    <label
                        htmlFor="customerId"
                        className="block text-sm font-medium text-gray-700 dark:text-slate-200"
                    >
                        Customer ID
                    </label>
                    <input
                        id="customerId"
                        type="text"
                        required
                        value={customerId}
                        onChange={(event) => setCustomerId(event.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                    />
                </div>

                <div className="pt-2">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Proceed to Pay'}
                    </Button>
                </div>
            </form>

            {message && (
                <p
                    className="mt-4 text-sm text-gray-700 dark:text-slate-300"
                    aria-live="polite"
                >
                    {message}
                </p>
            )}
        </div>
    );
}


