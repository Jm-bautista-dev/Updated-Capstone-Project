<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;

trait HasImageResolution
{
    /**
     * Resolve a stored image path to a public URL.
     * Handles local, Hostinger shared hosting, and misconfigured APP_URL.
     */
    protected function resolveImageUrl(?string $imagePath): ?string
    {
        if (!$imagePath) return null;
        
        // If it's already a full URL, return it
        if (filter_var($imagePath, FILTER_VALIDATE_URL)) {
            return $imagePath;
        }

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $url = $disk->url($imagePath);
            
            // Fix for Hostinger/Shared hosting where APP_URL might be misconfigured
            // If the generated URL contains localhost but the request is not from localhost
            $requestHost = request()->getHttpHost();
            if (str_contains($url, 'localhost') && !str_contains($requestHost, 'localhost')) {
                $protocol = request()->isSecure() ? 'https://' : 'http://';
                return $protocol . $requestHost . '/storage/' . ltrim($imagePath, '/');
            }
            
            return $url;
        } catch (\Exception $e) {
            $protocol = request()->isSecure() ? 'https://' : 'http://';
            $host = request()->getHttpHost();
            return $protocol . $host . '/storage/' . ltrim($imagePath, '/');
        }
    }
}
