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
        return \App\Utils\ImageHelper::resolveUrl($imagePath, 'categories');
    }
}
