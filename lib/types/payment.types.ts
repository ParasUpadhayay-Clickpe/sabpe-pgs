import type { PaymentGateway } from './gateway.types';
import type { UtilityType } from './utility.types';

export interface PaymentContext {
    gateway: PaymentGateway;
    utility: UtilityType;
    credentials: {
        apiKey: string;
        merchantId: string;
        secretKey: string;
        [key: string]: string;
    };
}


