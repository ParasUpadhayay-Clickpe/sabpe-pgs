'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { Gateway } from '../../lib/types/gateway.types';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

interface GatewayCardProps {
    gateway: Gateway;
}

/**
 * Card displaying a single payment gateway on the dashboard.
 */
export function GatewayCard({ gateway }: GatewayCardProps) {
    const router = useRouter();

    return (
        <Card
            isHoverable
            onClick={() => router.push(`/${gateway.id}`)}
            className="group"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 rounded-lg bg-gray-100 p-2">
                        <Image
                            src={gateway.logo}
                            alt={gateway.displayName}
                            fill
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-600">
                            {gateway.displayName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">{gateway.description}</p>
                    </div>
                </div>
                <Badge variant={gateway.status === 'active' ? 'success' : 'secondary'}>
                    {gateway.status}
                </Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                {gateway.supportedUtilities.map((utility) => (
                    <span
                        key={utility}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                        {utility}
                    </span>
                ))}
            </div>
        </Card>
    );
}


