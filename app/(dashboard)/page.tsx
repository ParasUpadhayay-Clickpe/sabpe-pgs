import { GATEWAYS } from '../../lib/constants/gateways';
import { GatewayCard } from '../../components/dashboard/gateway-card';

/**
 * Dashboard homepage: lists all payment gateways.
 */
export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                    Payment Gateways
                </h1>
                <p className="max-w-xl text-sm text-slate-600 dark:text-slate-400">
                    Select a payment gateway to view available utilities
                </p>
            </div>

            <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
                {GATEWAYS.map((gateway) => (
                    <GatewayCard key={gateway.id} gateway={gateway} />
                ))}
            </div>
        </div>
    );
}


