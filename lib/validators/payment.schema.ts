import { z } from 'zod';

export const paymentRequestSchema = z.object({
    utility: z.enum(['utility', 'electricity', 'education', 'fastag']),
    amount: z.number().positive(),
    customerId: z.string(),
});

export type PaymentRequestInput = z.infer<typeof paymentRequestSchema>;


