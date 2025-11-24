export type UtilityType = 'utility' | 'electricity' | 'education' | 'fastag';

export interface Utility {
    id: UtilityType;
    name: string;
    displayName: string;
    icon: string;
    description: string;
    category: string;
}

import type { PaymentGateway } from './gateway.types';

export interface GatewayUtilityCredentials {
    gatewayId: PaymentGateway;
    utilityId: UtilityType;
    credentials: {
        apiKey: string;
        merchantId: string;
        secretKey: string;
        [key: string]: string;
    };
}


