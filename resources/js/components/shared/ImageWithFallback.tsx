import { Package } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src?: string | null;
    alt?: string;
    className?: string;
    containerClassName?: string;
    fallbackIcon?: React.ReactNode;
    fallbackClassName?: string;
}

export function ImageWithFallback({
    src,
    alt = '',
    className = 'w-full h-full object-cover',
    containerClassName,
    fallbackIcon,
    fallbackClassName,
    ...props
}: ImageWithFallbackProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [prevSrc, setPrevSrc] = useState(src);

    // Adjust state during render when src prop changes (React recommended pattern)
    if (src !== prevSrc) {
        setPrevSrc(src);
        setHasError(false);
        setIsLoaded(false);
    }

    const showFallback = !src || hasError;

    if (showFallback) {
        return (
            <div
                className={cn(
                    'w-full h-full flex items-center justify-center bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/30 dark:from-[#1A1A24] dark:to-[#222230] text-[#E75480]/40 dark:text-[#FF4F81]/40 select-none',
                    containerClassName,
                    fallbackClassName
                )}
            >
                {fallbackIcon || <Package className="size-1/2 max-w-8 max-h-8 shrink-0 opacity-60" />}
            </div>
        );
    }

    return (
        <div className={cn('relative w-full h-full overflow-hidden flex items-center justify-center', containerClassName)}>
            {/* Subtle placeholder behind the image while loading */}
            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#FFF5F7]/50 dark:bg-[#1A1A24]/50">
                    {fallbackIcon || <Package className="size-1/2 max-w-6 max-h-6 shrink-0 opacity-20 text-[#E75480] animate-pulse" />}
                </div>
            )}
            <img
                src={src}
                alt={alt}
                onLoad={() => setIsLoaded(true)}
                onError={() => {
                    setHasError(true);
                }}
                className={cn(
                    className,
                    !isLoaded && 'opacity-0',
                    isLoaded && 'opacity-100 transition-opacity duration-300'
                )}
                {...props}
            />
        </div>
    );
}

export default ImageWithFallback;
