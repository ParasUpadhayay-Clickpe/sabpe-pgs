import { NextRequest, NextResponse } from 'next/server';
import {
    collection,
    doc,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';

import { db } from '../../../../lib/firebase/client';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json().catch(() => ({}))) as {
            payment_method?: string;
            merchant_order?: { id?: string; description?: string };
            customer?: Record<string, unknown>;
            payment_data?: {
                id?: string;
                status?: string;
                amount?: number;
                currency?: string;
                [key: string]: unknown;
            };
            card_account?: Record<string, unknown>;
            [key: string]: unknown;
        };

        const paymentData = body.payment_data ?? {};
        const rawStatus = (paymentData.status ?? '').toString().toUpperCase();

        let status: 'success' | 'failure' = 'failure';
        if (['COMPLETED', 'APPROVED', 'CONFIRMED', 'AUTHORIZED'].includes(rawStatus)) {
            status = 'success';
        }

        const orderId =
            body.merchant_order?.id ??
            paymentData.id ??
            `unlimit_${Date.now().toString(36)}`;

        await setDoc(doc(collection(db, 'payments'), orderId), {
            gateway: 'unlimit',
            status,
            orderId,
            receivedAt: serverTimestamp(),
            payment_method: body.payment_method ?? null,
            merchant_order: body.merchant_order ?? null,
            customer: body.customer ?? null,
            payment_data: paymentData,
            card_account: body.card_account ?? null,
            raw: body,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in /api/unlimit/callback:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}



