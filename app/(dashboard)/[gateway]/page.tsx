import { GATEWAYS } from '../../../lib/constants/gateways';
import { UTILITIES } from '../../../lib/constants/utilities';
import { Breadcrumb } from '../../../components/dashboard/breadcrumb';
import { GatewayTerminals } from '../../../components/dashboard/gateway-terminals';

export default async function GatewayPage({
    params,
}: {
    params: Promise<{ gateway: string }>;
}) {
    const { gateway } = await params;

    const rawGatewayId = gateway ?? '';
    const gatewayId = rawGatewayId.toLowerCase();
    const gatewayConfig = GATEWAYS.find(
        (g) => g.id.toLowerCase() === gatewayId,
    );

    return (
        <div>
            <Breadcrumb
                items={[
                    { label: 'Dashboard', href: '/' },
                    {
                        label: gatewayConfig?.displayName ?? 'Gateway',
                        href: `/${rawGatewayId}`,
                    },
                ]}
            />

            <div className="mb-8 mt-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    {gatewayConfig?.displayName ?? 'Gateway'} - Select Utility
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
                    {gatewayConfig?.description ??
                        'No gateway configuration found for this ID. Update GATEWAYS to add it.'}
                </p>
            </div>

            {gatewayConfig ? (
                <GatewayTerminals
                    gatewayId={gatewayConfig.id}
                    allUtilities={UTILITIES}
                    initialUtilityIds={gatewayConfig.supportedUtilities}
                />
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400">
                    Gateway ID <span className="font-mono">{rawGatewayId}</span> is not
                    defined in your configuration.
                </div>
            )}
        </div>
    );
}


