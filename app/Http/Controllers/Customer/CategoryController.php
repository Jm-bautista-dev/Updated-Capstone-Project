<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
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
                    'image' => $category->image_path 
                        ? (str_starts_with($category->image_path, 'http') ? $category->image_path : asset('storage/' . $category->image_path))
                        : null,
                ];
            });

        return response()->json($categories);
    }
}
