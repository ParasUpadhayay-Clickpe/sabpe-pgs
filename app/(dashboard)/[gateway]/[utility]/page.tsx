import { notFound } from 'next/navigation';

import { GATEWAYS } from '../../../../lib/constants/gateways';
import { UTILITIES } from '../../../../lib/constants/utilities';
import { Breadcrumb } from '../../../../components/dashboard/breadcrumb';
import { PaymentWrapper } from '../../../../components/payment/payment-wrapper';

interface PaymentPageProps {
    params: {
        gateway: string;
        utility: string;
    };
    searchParams?: {
        mode?: string;
    };
}

export default function PaymentPage({ params, searchParams }: PaymentPageProps) {
    const gateway = GATEWAYS.find((g) => g.id === params.gateway);
    const utility = UTILITIES.find((u) => u.id === params.utility);

    if (!gateway || !utility) {
        notFound();
    }

    if (!gateway.supportedUtilities.includes(utility.id)) {
        notFound();
    }

    const modeParam = (searchParams?.mode ?? 'uat').toLowerCase();
    const mode = modeParam === 'prod' ? 'prod' : 'uat';

    return (
        <div>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/' },
                    { label: gateway.displayName, href: `/${gateway.id}` },
                    {
                        label: utility.displayName,
                        href: `/${gateway.id}/${utility.id}?mode=${mode}`,
                    },
                ]}
            />

            <div className="mb-8 mt-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {utility.displayName} Payment ({mode.toUpperCase()})
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                    Processing via {gateway.displayName} in {mode.toUpperCase()} mode.
                </p>
            </div>

            <PaymentWrapper
                gateway={params.gateway}
                utility={params.utility}
                mode={mode}
            />
        </div>
    );
}


