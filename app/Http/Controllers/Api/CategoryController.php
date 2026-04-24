<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    /**
     * List categories specific to the user's branch.
     * GET /api/v1/categories
     */
    public function index(Request $request): JsonResponse
    {
        $categories = Category::orderBy('name')
            ->get()
            ->map(function (Category $cat) {
                return [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'image_url' => $this->resolveImageUrl($cat->image_path),
                ];
            });

        return response()->json($categories);
    }

    private function resolveImageUrl(?string $imagePath): ?string
    {
        if (!$imagePath) return null;
        
        if (filter_var($imagePath, FILTER_VALIDATE_URL)) {
            return $imagePath;
        }

        try {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $url = $disk->url($imagePath);
            
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
