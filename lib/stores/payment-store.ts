import { create } from 'zustand';

import type { PaymentContext } from '../types/payment.types';

interface PaymentStore {
    context: PaymentContext | null;
    setContext: (context: PaymentContext) => void;
    clearContext: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
    context: null,
    setContext: (context) => set({ context }),
    clearContext: () => set({ context: null }),
}));


