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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const generateRandomCustomerId = () => {
        const timePart = Date.now().toString(36).toUpperCase();
        const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `CUST_${timePart}_${randomPart}`;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            // Unlimit → call dedicated API which talks to CardPay and returns redirect_url
            if (gateway === 'unlimit') {
                const generatedCustomerId = generateRandomCustomerId();

                const response = await fetch('/api/unlimit/payments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount,
                        currency: 'INR',
                        customer_email: undefined,
                        description: `${utility.toUpperCase()} payment via Unlimit (ID: ${generatedCustomerId})`,
                        request_name: `ClickPe ${utility} payment`,
                        utility,
                    }),
                });

                const json = await response.json().catch(() => ({}));

                if (!response.ok) {
                    setMessage(
                        json.error ??
                        'Unlimit payment request failed – check server logs.',
                    );
                    return;
                }

                const upstream = json.upstreamBody ?? json;
                const redirectUrl =
                    upstream.redirect_url ??
                    upstream.redirectUrl ??
                    upstream?.payment_data?.redirect_url ??
                    null;

                if (!redirectUrl) {
                    setMessage(
                        'Payment succeeded but no redirect_url was found in the response.',
                    );
                    return;
                }

                window.location.href = redirectUrl as string;
                return;
            }

            // Default: generic initialization endpoint
            const generatedCustomerId = generateRandomCustomerId();

            const response = await fetch(`/api/payment/${gateway}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    utility,
                    amount: Number(amount),
                    customerId: generatedCustomerId,
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
                <span className="font-medium">{utility}</span>
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


