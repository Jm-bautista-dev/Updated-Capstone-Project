<?php

namespace App\Utils;

use Illuminate\Support\Facades\Storage;

class ImageHelper
{
    /**
     * Resolve a stored image path to a verified, public production URL.
     * If the physical file does not exist on disk, returns null to prevent 404 errors.
     *
     * @param string|null $path
     * @param string $defaultFolder Default subfolder (e.g. 'products', 'categories', 'receipts')
     * @return string|null
     */
    public static function resolveUrl(?string $path, string $defaultFolder = 'products'): ?string
    {
        if (!$path || !is_string($path)) {
            return null;
        }

        $path = trim($path);
        if ($path === '') {
            return null;
        }

        // 1. Handle full URLs
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            $parsedUrl = parse_url($path);
            $urlHost = $parsedUrl['host'] ?? '';
            $urlPath = $parsedUrl['path'] ?? '';
            $requestHost = request()->getHost();

            // If it's a 3rd party external URL (CDN, Cloudinary, S3, Unsplash, etc.), return as is
            $isLocalOrAppHost = in_array($urlHost, ['localhost', '127.0.0.1', $requestHost], true) ||
                                (config('app.url') && str_contains(config('app.url'), $urlHost));

            if (!$isLocalOrAppHost && !empty($urlHost)) {
                return $path;
            }

            // If it's an internal URL pointing to /storage/..., extract relative path
            if (str_contains($urlPath, '/storage/')) {
                $path = substr($urlPath, strpos($urlPath, '/storage/') + 9);
            } elseif (str_contains($urlPath, '/images/')) {
                $candidate = substr($urlPath, strpos($urlPath, '/images/') + 8);
                if (file_exists(public_path('images/' . $candidate))) {
                    return self::formatUrl('images/' . $candidate);
                }
                return null;
            }
        }

        // 2. Clean and normalize path prefixes
        $normalized = str_replace('\\', '/', $path);
        $normalized = ltrim($normalized, '/');
        
        if (str_starts_with($normalized, 'public/storage/')) {
            $normalized = substr($normalized, 15);
        } elseif (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, 8);
        } elseif (str_starts_with($normalized, 'public/')) {
            $normalized = substr($normalized, 7);
        }

        $normalized = ltrim($normalized, '/');
        if ($normalized === '') {
            return null;
        }

        // 3. Check possible candidate locations
        $candidates = array_unique(array_filter([
            $normalized,
            $defaultFolder ? (rtrim($defaultFolder, '/') . '/' . basename($normalized)) : null,
            basename($normalized),
        ]));

        foreach ($candidates as $candidate) {
            // 1. Check Laravel public disk (covers storage/app/public, testing fakes, and cloud disks)
            if (Storage::disk('public')->exists($candidate)) {
                $storageAppPath = storage_path('app/public/' . $candidate);
                $publicStoragePath = public_path('storage/' . $candidate);
                self::ensurePublicCopy($candidate, $storageAppPath, $publicStoragePath);
                return self::formatUrl('storage/' . $candidate);
            }

            // 2. Check if file exists directly in public/storage
            $publicStoragePath = public_path('storage/' . $candidate);
            if (file_exists($publicStoragePath) && is_file($publicStoragePath)) {
                return self::formatUrl('storage/' . $candidate);
            }

            // 3. Check if file exists in public/images
            $publicImagesPath = public_path('images/' . $candidate);
            if (file_exists($publicImagesPath) && is_file($publicImagesPath)) {
                return self::formatUrl('images/' . $candidate);
            }
        }

        // 4. File does not physically exist -> return null to prevent 404 requests
        return null;
    }

    /**
     * Delete an image file across all storage locations (Laravel public disk, public/storage, storage, public_html/storage).
     * Prevents orphaned physical files from remaining on disk after database records are updated or deleted.
     */
    public static function deleteImageFile(?string $imagePath): void
    {
        if (!$imagePath || !is_string($imagePath)) {
            return;
        }

        $normalized = str_replace('\\', '/', trim($imagePath));
        $normalized = ltrim($normalized, '/');

        if (str_starts_with($normalized, 'public/storage/')) {
            $normalized = substr($normalized, 15);
        } elseif (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, 8);
        } elseif (str_starts_with($normalized, 'public/')) {
            $normalized = substr($normalized, 7);
        }

        $normalized = ltrim($normalized, '/');
        if ($normalized === '') {
            return;
        }

        // 1. Delete from Laravel's public disk
        if (Storage::disk('public')->exists($normalized)) {
            Storage::disk('public')->delete($normalized);
        }

        // 2. Delete from all physical mirror destinations
        $targets = array_unique([
            storage_path('app/public/' . $normalized),
            public_path('storage/' . $normalized),
            base_path('storage/' . $normalized),
            base_path('public/storage/' . $normalized),
            base_path('public_html/storage/' . $normalized),
        ]);

        foreach ($targets as $dest) {
            if (file_exists($dest) && is_file($dest)) {
                @unlink($dest);
            }
        }
    }

    /**
     * Copy uploaded image to public/storage if symlink is unavailable/broken (e.g. shared hosting).
     */
    public static function syncToPublicStorage(?string $imagePath): void
    {
        if (!$imagePath) return;

        $normalized = ltrim(str_replace('\\', '/', $imagePath), '/');
        if (str_starts_with($normalized, 'public/storage/')) {
            $normalized = substr($normalized, 15);
        } elseif (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, 8);
        } elseif (str_starts_with($normalized, 'public/')) {
            $normalized = substr($normalized, 7);
        }

        $source = storage_path('app/public/' . $normalized);
        if (!file_exists($source) || !is_file($source)) {
            return;
        }

        // Target destinations to ensure accessibility regardless of document root:
        // 1. public/storage/... (standard Laravel public disk symlink location)
        // 2. storage/... (Hostinger document root where storage/ is directly under public_html)
        $targets = array_unique([
            public_path('storage/' . $normalized),
            base_path('storage/' . $normalized),
            base_path('public/storage/' . $normalized),
            base_path('public_html/storage/' . $normalized),
        ]);

        foreach ($targets as $dest) {
            self::ensurePublicCopy($normalized, $source, $dest);
        }
    }

    /**
     * Safely copy file to public directory if not already there or symlinked.
     */
    private static function ensurePublicCopy(string $candidate, string $source, string $dest): void
    {
        if ($source === $dest) {
            return;
        }

        // Clean up broken symlinks if present
        $destDir = dirname($dest);
        if (is_link($destDir) && !file_exists($destDir)) {
            @unlink($destDir);
        }
        if (!is_dir($destDir)) {
            @mkdir($destDir, 0755, true);
        }

        if (is_link($dest) && !file_exists($dest)) {
            @unlink($dest);
        }

        if (!file_exists($dest)) {
            @copy($source, $dest);
        }
    }

    /**
     * Format a path to a proper relative or absolute URL based on the current request.
     */
    private static function formatUrl(string $relativePath): string
    {
        $relativePath = ltrim($relativePath, '/');

        // For console or web dashboard requests, return root-relative path (e.g. /storage/products/123.png).
        // Root-relative paths are 100% immune to Hostinger reverse proxy SSL / Mixed Content issues and port mismatches.
        if (app()->runningInConsole() || !request()->is('api/*')) {
            return '/' . $relativePath;
        }

        $request = request();
        $schemeAndHttpHost = $request->getSchemeAndHttpHost();

        // If in production or requested via HTTPS/X-Forwarded-Proto, ensure HTTPS for mobile API consumers
        if (app()->environment('production') || $request->isSecure() || $request->header('x-forwarded-proto') === 'https') {
            $schemeAndHttpHost = preg_replace('/^http:/i', 'https:', $schemeAndHttpHost);
        }

        // Return protocol + current host + relative path for API
        return rtrim($schemeAndHttpHost, '/') . '/' . $relativePath;
    }
}
