import Link from 'next/link';

interface SearchParams {
    [key: string]: string | string[] | undefined;
}

export default async function PaymentResultPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const params = await searchParams;

    const rawStatus = (params.status as string | undefined) ?? '';
    const status = rawStatus.toLowerCase() === 'success' ? 'success' : 'failure';
    const orderId = params.orderId as string | undefined;

    const isSuccess = status === 'success';

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center shadow-xl">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
                    {isSuccess ? 'Payment Successful' : 'Payment Failed'}
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    {isSuccess
                        ? 'Your payment has been processed successfully.'
                        : 'We could not complete your payment. If money was debited, it will be auto‑reversed by the gateway.'}
                </p>

                {orderId && (
                    <p className="mt-4 text-xs font-mono text-slate-400">
                        ORDER_ID: <span className="text-slate-200">{orderId}</span>
                    </p>
                )}

                <div className="mt-8">
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}


