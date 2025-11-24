import { NextRequest, NextResponse } from 'next/server';

import { paymentRequestSchema } from '../../../../lib/validators/payment.schema';

async function getCredentials(gateway: string, utility: string) {
    const upperGateway = gateway.toUpperCase();
    const upperUtility = utility.toUpperCase();

    return {
        apiKey: process.env[`${upperGateway}_${upperUtility}_API_KEY`] ?? '',
        merchantId: process.env[`${upperGateway}_${upperUtility}_MERCHANT_ID`] ?? '',
        secretKey: process.env[`${upperGateway}_${upperUtility}_SECRET_KEY`] ?? '',
    };
}

export async function POST(
    request: NextRequest,
    { params }: { params: { gateway: string } },
) {
    try {
        const body = await request.json();
        const validatedData = paymentRequestSchema.parse(body);

        const credentials = await getCredentials(
            params.gateway,
            validatedData.utility,
        );

        return NextResponse.json({
            success: true,
            data: {
                gateway: params.gateway,
                utility: validatedData.utility,
                credentials,
                context: validatedData,
            },
        });
    } catch (error: unknown) {
        if (error instanceof Error && 'issues' in (error as never)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request data',
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 },
        );
    }
}


