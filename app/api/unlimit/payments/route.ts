import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
    collection,
    getDocs,
    limit,
    query,
    where,
} from 'firebase/firestore';

import { db } from '../../../../lib/firebase/client';

interface UnlimitConfig {
    apiBase: string;
    terminalCode: string;
    terminalPassword: string;
}

async function getUnlimitConfigForUtility(
    utility: string,
): Promise<UnlimitConfig | null> {
    const terminalsRef = collection(db, 'gateways', 'unlimit', 'terminals');
    const q = query(
        terminalsRef,
        where('utilityId', '==', utility),
        limit(1),
    );
    const snap = await getDocs(q);

    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const data = docSnap.data() as Partial<UnlimitConfig> & {
        apiBase?: string;
        terminalCode?: string;
        terminalPassword?: string;
    };

    if (!data.apiBase || !data.terminalCode || !data.terminalPassword) {
        console.error(
            'Unlimit config document is missing required fields',
            docSnap.id,
        );
        return null;
    }

    return {
        apiBase: data.apiBase,
        terminalCode: data.terminalCode,
        terminalPassword: data.terminalPassword,
    };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({} as Record<string, unknown>));

        const amount = (body.amount as string | number | undefined) ?? '12.34';
        const currency = (body.currency as string | undefined) ?? 'INR';
        const email =
            (body.customer_email as string | undefined) ?? 'customer@email.com';
        const description =
            (body.description as string | undefined) ??
            'Unlimit sandbox demo payment';
        const requestName =
            (body.request_name as string | undefined) ?? 'Demo request from UI';
        const utility = (body.utility as string | undefined) ?? 'utility';

        const config = await getUnlimitConfigForUtility(utility);

        if (!config) {
            return NextResponse.json(
                {
                    error:
                        'Unlimit terminal configuration not found in Firestore for this utility. Please create a document under gateways/unlimit/terminals with fields: utilityId, apiBase, terminalCode, terminalPassword.',
                },
                { status: 500 },
            );
        }

        const authParams = new URLSearchParams();
        authParams.append('grant_type', 'password');
        authParams.append('terminal_code', config.terminalCode);
        authParams.append('password', config.terminalPassword);

        const authRes = await fetch(`${config.apiBase}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: authParams.toString(),
        });

        const authJson = await authRes.json().catch(() => ({}));

        if (!authRes.ok) {
            return NextResponse.json(
                { error: 'Auth token request failed', upstreamBody: authJson },
                { status: authRes.status },
            );
        }

        const accessToken: string | undefined =
            (authJson as Record<string, unknown>).access_token as string |
            undefined ??
            ((authJson as Record<string, unknown>).accessToken as string | undefined);

        if (!accessToken) {
            return NextResponse.json(
                {
                    error:
                        'Auth token response did not contain an access_token field.',
                    upstreamBody: authJson,
                },
                { status: 500 },
            );
        }

        const requestId = crypto.randomUUID();
        const orderId = crypto.randomUUID();
        const now = new Date().toISOString();

        const payload = {
            request: {
                id: requestId,
                time: now,
            },
            merchant_order: {
                id: orderId,
                description: `UI Order ("${requestName}")`,
            },
            payment_method: 'BANKCARD',
            payment_data: {
                amount: String(amount),
                currency,
            },
            customer: {
                email,
            },
        };

        const upstream = await fetch(`${config.apiBase}/payments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await upstream.json().catch(() => ({}));

        return NextResponse.json(
            {
                upstreamStatus: upstream.status,
                payloadSent: payload,
                upstreamBody: data,
            },
            { status: upstream.status },
        );
    } catch (error) {
        console.error('Error in /api/unlimit/payments:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}



