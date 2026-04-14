import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            {/* Minimalist Ramen Bowl Icon */}
            <path d="M4 18C4 28 11 36 20 36C29 36 36 28 36 18H4Z" fill="currentColor" />
            <path d="M2 14H38V18H2V14Z" fill="currentColor" />
            <rect x="18" y="2" width="2" height="10" rx="1" fill="currentColor" />
            <rect x="24" y="4" width="2" height="8" rx="1" fill="currentColor" />
            <rect x="12" y="4" width="2" height="8" rx="1" fill="currentColor" />
        </svg>
    );
}
