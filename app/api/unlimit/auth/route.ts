import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.UNLIMIT_API_BASE ?? 'https://sandbox.cardpay.com/api';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({} as Record<string, unknown>));
        const grantType = body.grant_type as string | undefined;

        if (!grantType) {
            return NextResponse.json(
                { error: 'Missing grant_type' },
                { status: 400 },
            );
        }

        const params = new URLSearchParams();
        params.append('grant_type', grantType);

        if (grantType === 'password') {
            const terminalCode =
                (body.terminal_code as string | undefined) ??
                process.env.UNLIMIT_TERMINAL_CODE;
            const password =
                (body.password as string | undefined) ??
                process.env.UNLIMIT_TERMINAL_PASSWORD;

            if (!terminalCode || !password) {
                return NextResponse.json(
                    {
                        error:
                            'Missing terminal_code or password. Provide them in the request body or via UNLIMIT_TERMINAL_CODE and UNLIMIT_TERMINAL_PASSWORD env vars.',
                    },
                    { status: 400 },
                );
            }

            params.append('terminal_code', terminalCode);
            params.append('password', password);
        } else if (grantType === 'refresh_token') {
            const refreshToken = body.refresh_token as string | undefined;
            if (!refreshToken) {
                return NextResponse.json(
                    { error: 'Missing refresh_token' },
                    { status: 400 },
                );
            }
            params.append('refresh_token', refreshToken);
        } else {
            return NextResponse.json(
                { error: 'Unsupported grant_type' },
                { status: 400 },
            );
        }

        const upstream = await fetch(`${API_BASE}/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const data = await upstream.json().catch(() => ({}));

        return NextResponse.json(data, { status: upstream.status });
    } catch (error) {
        console.error('Error in /api/unlimit/auth:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}



