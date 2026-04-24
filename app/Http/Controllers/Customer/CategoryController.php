<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

use App\Traits\HasImageResolution;

class CategoryController extends Controller
{
    use HasImageResolution;

    /**
     * Display a listing of categories for customers.
     * ONLY public data exposed.
     */
    public function index(Request $request)
    {
        $branchId = $request->branch_id ?? 1;

        // Fetch categories (simplified for reliability)
        $categories = Category::select(['id', 'name', 'image_path'])
            ->get()
            ->map(function ($category) {
                return [
                    'id'    => $category->id,
                    'name'  => $category->name,
                    'slug'  => \Illuminate\Support\Str::slug($category->name),
                    'image' => $this->resolveImageUrl($category->image_path),
                ];
            });

        return response()->json($categories);
    }
}
