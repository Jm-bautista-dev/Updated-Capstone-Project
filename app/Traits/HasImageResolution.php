<?php

namespace App\Traits;

use App\Utils\ImageHelper;

trait HasImageResolution
{
    /**
     * Resolve a stored image path to a verified public URL.
     * Handles local, Hostinger shared hosting, and prevents 404s for missing files.
     */
    protected function resolveImageUrl(?string $imagePath, string $defaultFolder = 'products'): ?string
    {
        return ImageHelper::resolveUrl($imagePath, $defaultFolder);
    }
}

