export type PaymentGateway = 'pay10' | 'unlimit' | 'zwitch' | 'sabpaisa';

export interface Gateway {
    id: PaymentGateway;
    name: string;
    displayName: string;
    logo: string;
    description: string;
    status: 'active' | 'inactive';
    supportedUtilities: UtilityType[];
}

import type { UtilityType } from './utility.types';


