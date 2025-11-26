import type { Gateway } from '../types/gateway.types';

export const GATEWAYS: Gateway[] = [
    {
        id: 'pay10',
        name: 'pay10',
        displayName: 'Pay10',
        logo: '/logos/pay10.jpg',
        description: 'Fast and secure payment processing',
        status: 'active',
        supportedUtilities: ['utility', 'electricity', 'education', 'fastag'],
    },
    {
        id: 'unlimit',
        name: 'UnLimit',
        displayName: 'UnLimit',
        logo: '/logos/unlimit.png',
        description: 'Unlimited payment solutions',
        status: 'active',
        supportedUtilities: ['utility', 'electricity', 'education'],
    },
    {
        id: 'zwitch',
        name: 'zwitch',
        displayName: 'Zwitch',
        logo: '/logos/zwitch.png',
        description: 'Smart payment gateway',
        status: 'active',
        supportedUtilities: ['electricity', 'fastag'],
    },
    {
        id: 'sabpaisa',
        name: 'SabPaisa',
        displayName: 'SabPaisa',
        logo: '/logos/sabpaisa.png',
        description: 'SabPaisa payment gateway',
        status: 'active',
        supportedUtilities: ['utility', 'electricity', 'education', 'fastag'],
    },
];


