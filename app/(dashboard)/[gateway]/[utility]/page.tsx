import { notFound } from 'next/navigation';

import { GATEWAYS } from '../../../../lib/constants/gateways';
import { UTILITIES } from '../../../../lib/constants/utilities';
import { Breadcrumb } from '../../../../components/dashboard/breadcrumb';
import { PaymentWrapper } from '../../../../components/payment/payment-wrapper';
import { Pay10TerminalPayment } from '../../../../components/payment/pay10-terminal-payment';

interface PaymentPageParams {
    gateway: string;
    utility: string;
}

interface PaymentPageSearchParams {
    mode?: string;
}

export default async function PaymentPage({
    params,
    searchParams,
}: {
    params: Promise<PaymentPageParams>;
    searchParams?: Promise<PaymentPageSearchParams>;
}) {
    const { gateway, utility } = await params;
    const resolvedSearch = (await searchParams) ?? {};

    const gatewayConfig = GATEWAYS.find((g) => g.id === gateway);
    const utilityConfig = UTILITIES.find((u) => u.id === utility);

    if (!gatewayConfig || !utilityConfig) {
        notFound();
    }

    if (!gatewayConfig.supportedUtilities.includes(utilityConfig.id)) {
        notFound();
    }

    const modeParam = (resolvedSearch.mode ?? 'uat').toLowerCase();
    const mode = modeParam === 'prod' ? 'prod' : 'uat';

    return (
        <div>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/' },
                    { label: gatewayConfig.displayName, href: `/${gatewayConfig.id}` },
                    {
                        label: utilityConfig.displayName,
                        href: `/${gatewayConfig.id}/${utilityConfig.id}?mode=${mode}`,
                    },
                ]}
            />

            <div className="mb-8 mt-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {utilityConfig.displayName} Payment
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                    Processing via {gatewayConfig.displayName}.
                </p>
            </div>

            {gatewayConfig.id === 'pay10' ? (
                <Pay10TerminalPayment gatewayId={gateway} utilityId={utility} />
            ) : (
                <PaymentWrapper gateway={gateway} utility={utility} mode={mode} />
            )}
        </div>
    );
}


