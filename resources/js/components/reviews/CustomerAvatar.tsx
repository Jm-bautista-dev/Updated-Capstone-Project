import React from 'react';
import { cn } from '@/lib/utils';

interface CustomerAvatarProps {
    name?: string | null;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeConfig = {
    sm: 'size-7 text-xs',
    md: 'size-9 text-xs',
    lg: 'size-11 text-sm',
};

export const CustomerAvatar: React.FC<CustomerAvatarProps> = ({
    name,
    size = 'md',
    className,
}) => {
    const initial = (name?.trim().charAt(0) || 'C').toUpperCase();

    return (
        <div
            className={cn(
                'rounded-full bg-linear-to-br from-[#FF3366] to-[#E1062C] text-white flex items-center justify-center font-black select-none shadow-sm shrink-0 ring-1 ring-white/10',
                sizeConfig[size],
                className
            )}
        >
            <span>{initial}</span>
        </div>
    );
};
