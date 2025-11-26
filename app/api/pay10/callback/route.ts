import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
    collection,
    collectionGroup,
    doc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    where,
} from 'firebase/firestore';

import { db } from '../../../../lib/firebase/client';

export const runtime = 'nodejs';

function decryptEncData(encdata: string, encryptionKey: string): string | null {
    try {
        const keyStr = encryptionKey;
        const ivStr = encryptionKey.slice(0, 16);

        const keyBytes = Buffer.from(keyStr, 'utf8');
        const ivBytes = Buffer.from(ivStr, 'utf8');

        const encryptedBytes = Buffer.from(encdata, 'base64');

        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            keyBytes,
            ivBytes,
        );

        const decrypted = Buffer.concat([
            decipher.update(encryptedBytes),
            decipher.final(),
        ]);

        return decrypted.toString('utf8');
    } catch (error) {
        console.error('Failed to decrypt ENCDATA', error);
        return null;
    }
}

function parseDecryptedData(text: string): Record<string, string> {
    try {
        const parsed = JSON.parse(text) as Record<string, string>;
        return parsed;
    } catch {
        const data: Record<string, string> = {};
        for (const pair of text.split('~')) {
            if (!pair.includes('=')) continue;
            const idx = pair.indexOf('=');
            const key = pair.slice(0, idx);
            const value = pair.slice(idx + 1);
            if (key) data[key] = value;
        }
        return data;
    }
}

export async function POST(request: NextRequest) {
    const formData = await request.formData();

    const encdata = formData.get('ENCDATA');
    const payId = formData.get('PAY_ID');

    if (!encdata || typeof encdata !== 'string') {
        return NextResponse.json(
            { error: 'No ENCDATA received', received: Object.fromEntries(formData) },
            { status: 400 },
        );
    }

    if (!payId || typeof payId !== 'string') {
        return NextResponse.json(
            { error: 'No PAY_ID received', received: Object.fromEntries(formData) },
            { status: 400 },
        );
    }

    // Look up the terminal configuration in Firestore using PAY_ID to get the encryption key.
    let encryptionKey: string | null = null;
    try {
        const q = query(
            collectionGroup(db, 'terminals'),
            where('payloadId', '==', payId),
            limit(1),
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
            const docSnap = snap.docs[0];
            const data = docSnap.data() as { encryptionKey?: string };
            if (data.encryptionKey && typeof data.encryptionKey === 'string') {
                encryptionKey = data.encryptionKey;
            }
        }
    } catch (error) {
        console.error('Failed to load terminal encryption key from Firestore', error);
    }

    if (!encryptionKey) {
        return NextResponse.json(
            { error: 'No encryptionKey found for PAY_ID', payId },
            { status: 500 },
        );
    }

    const decrypted = decryptEncData(encdata, encryptionKey);

    if (!decrypted) {
        return NextResponse.json(
            { error: 'Failed to decrypt ENCDATA' },
            { status: 500 },
        );
    }

    const parsed = parseDecryptedData(decrypted);

    const orderId =
        parsed.ORDER_ID ??
        parsed.orderId ??
        parsed.ORDERID ??
        parsed.ORDER_NO ??
        parsed.ORDERNO;

    // Decide success/failure.
    // Default to failure; mark success only when gateway clearly says so.
    let status: 'success' | 'failure' = 'failure';

    const statusText = (parsed.STATUS ?? parsed.RESPONSE_MESSAGE ?? '')
        .toString()
        .toLowerCase();
    const responseCode = (parsed.RESPONSE_CODE ?? '').toString();

    const looksSuccessful =
        statusText.includes('success') ||
        statusText.includes('captur') || // Captured / capture
        responseCode === '000';

    if (looksSuccessful) {
        status = 'success';
    }

    // Persist the decoded Pay10 response to Firestore:
    // - original ENCDATA (as received from gateway)
    // - decrypted raw string (before parsing)
    // - every key/value from the parsed payload as its own field
    // - plus some metadata (gateway, status, orderId, receivedAt).
    try {
        const paymentsCollection = collection(db, 'payments');
        const paymentId =
            typeof orderId === 'string' && orderId.trim().length > 0
                ? orderId
                : `pay10_${Date.now().toString(36)}`;

        await setDoc(doc(paymentsCollection, paymentId), {
            // metadata
            gateway: 'pay10',
            status,
            orderId: orderId ?? null,
            receivedAt: serverTimestamp(),
            encdata,
            decryptedRaw: decrypted,
            // decoded gateway fields (KEY=VALUE~KEY=VALUE or JSON)
            ...parsed,
            // optional: keep a nested copy for easy inspection
            raw: parsed,
        });
    } catch (error) {
        console.error('Failed to persist Pay10 payment response to Firestore', error);
    }

    // Decide where to redirect the user after processing the callback.
    // Prefer an explicit app origin from env (for production), otherwise fall back to the current request origin.
    const envOrigin =
        process.env.NEXT_PUBLIC_APP_ORIGIN ??
        process.env.APP_ORIGIN ??
        'https://main.d30didj5da2cv2.amplifyapp.com';
    const normalizedEnvOrigin = envOrigin.replace(/\/$/, '');
    const origin =
        normalizedEnvOrigin || new URL(request.url).origin;
    const search = new URLSearchParams();
    search.set('status', status);
    if (orderId) search.set('orderId', orderId);

    const redirectUrl = `${origin}/payment/result?${search.toString()}`;

    return NextResponse.redirect(redirectUrl, { status: 302 });
}


