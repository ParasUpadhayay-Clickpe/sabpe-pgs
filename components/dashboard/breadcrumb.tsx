import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
    label: string;
    href: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

/**
 * Simple breadcrumb navigation component for dashboard pages.
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
            <ol className="flex flex-wrap items-center gap-1">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={item.href} className="flex items-center gap-1">
                            {!isLast ? (
                                <Link
                                    href={item.href}
                                    className="font-medium text-gray-600 transition-colors hover:text-blue-600"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="font-semibold text-gray-900">
                                    {item.label}
                                </span>
                            )}
                            {!isLast && (
                                <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}


