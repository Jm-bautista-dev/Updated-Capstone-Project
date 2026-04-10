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
        $user = auth('sanctum')->user();
        
        // Priority: Request Param -> User Profile -> Default to Branch 1
        $branchId = $request->branch_id ?? $user?->branch_id ?? 1;

        $categories = Category::whereIn('id', function ($query) use ($branchId) {
            $query->select('category_id')
                  ->from('branch_category')
                  ->where('branch_id', $branchId);
        })
            ->orderBy('name')
            ->get()
            ->map(function (Category $cat) {
                return [
                    'id' => $cat->id,
                    'name' => $cat->name,
                ];
            });

        return response()->json($categories);
    }
}
