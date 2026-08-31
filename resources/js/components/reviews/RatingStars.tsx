import { Star } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
    rating: number;
    maxRating?: number;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    showScore?: boolean;
    reviewCount?: number;
    countLabel?: string;
    className?: string;
}

const sizeMap = {
    xs: { icon: 'size-3', text: 'text-[10px]', gap: 'gap-0.5' },
    sm: { icon: 'size-3.5', text: 'text-xs', gap: 'gap-0.5' },
    md: { icon: 'size-4', text: 'text-xs', gap: 'gap-1' },
    lg: { icon: 'size-5', text: 'text-sm', gap: 'gap-1' },
};

export const RatingStars: React.FC<RatingStarsProps> = ({
    rating,
    maxRating = 5,
    size = 'sm',
    showScore = false,
    reviewCount,
    countLabel,
    className,
}) => {
    const config = sizeMap[size];
    const roundedRating = Math.round(rating);

    return (
        <div className={cn('inline-flex items-center', config.gap, className)}>
            <div className="flex items-center gap-0.5 shrink-0" aria-label={`Rating: ${rating} out of ${maxRating} stars`}>
                {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => {
                    const isFilled = star <= roundedRating;
                    return (
                        <Star
                            key={star}
                            className={cn(
                                config.icon,
                                'transition-colors',
                                isFilled
                                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.25)]'
                                    : 'fill-slate-200 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                            )}
                        />
                    );
                })}
            </div>

            {showScore && (
                <span className={cn('font-mono font-bold text-amber-500 dark:text-amber-400 ml-1', config.text)}>
                    {Number(rating).toFixed(1)}
                </span>
            )}

            {reviewCount !== undefined && (
                <span className={cn('text-slate-400 dark:text-slate-500 font-medium ml-1', config.text)}>
                    {countLabel ?? `(${reviewCount})`}
                </span>
            )}
        </div>
    );
};
