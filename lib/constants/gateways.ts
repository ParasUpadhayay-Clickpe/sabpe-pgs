import type { Gateway } from '../types/gateway.types';

export const GATEWAYS: Gateway[] = [
    {
        id: 'pay10',
        name: 'pay10',
        displayName: 'Pay10',
        logo: '/logos/pay10.svg',
        description: 'Fast and secure payment processing',
        status: 'active',
        supportedUtilities: ['utility', 'electricity', 'education', 'fastag'],
    },
    {
        id: 'unlimited',
        name: 'unlimited',
        displayName: 'UnLimit',
        logo: '/logos/unlimited.svg',
        description: 'Unlimited payment solutions',
        status: 'active',
        supportedUtilities: ['utility', 'electricity', 'education'],
    },
    {
        id: 'zwitch',
        name: 'zwitch',
        displayName: 'Zwitch',
        logo: '/logos/zwitch.svg',
        description: 'Smart payment gateway',
        status: 'active',
        supportedUtilities: ['electricity', 'fastag'],
    },
];


