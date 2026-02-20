<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CategoriesController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('categories');

        if ($request->filled('filter_category')) {
            $query->where('id', $request->filter_category);
        }

        $categories = $query->orderBy('name')->get()->map(function($category) {
            return (object) [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'product_count' => 0, // placeholder, will count products later
            ];
        });

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'allCategories' => DB::table('categories')->orderBy('name')->get(), // for dropdown filter
            'selectedCategory' => $request->filter_category ?? null,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        DB::table('categories')->insert([
            'name' => $request->name,
            'description' => $request->description,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        DB::table('categories')->where('id', $id)->update([
            'name' => $request->name,
            'description' => $request->description,
            'updated_at' => now(),
        ]);

        return redirect()->back();
    }

    public function destroy($id)
    {
        DB::table('categories')->where('id', $id)->delete();

        return redirect()->back();
    }
}
