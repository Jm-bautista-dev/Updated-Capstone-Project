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
        // For a restaurant app, categories are usually global or shared.
        // We will return all categories to ensure they show up in the Expo app.
        $categories = Category::orderBy('name')
            ->get()
            ->map(function (Category $cat) {
                return [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'image_url' => $cat->image_path ? asset('storage/' . $cat->image_path) : null,
                ];
            });

        return response()->json($categories);
    }
}
