<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Services\CategoryService;

class CategoriesController extends Controller
{
    use AuthorizesRequests;

    protected $categoryService;

    public function __construct(CategoryService $categoryService)
    {
        $this->categoryService = $categoryService;
    }

    public function index(Request $request)
    {
        $query = Category::query()->withCount('products');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->orderBy('name')->get()->map(function (Category $category) {
            $category->image_url = $category->image_path
                ? asset('storage/' . $category->image_path)
                : null;
            return $category;
        });

        return Inertia::render('Categories/Index', [
            'categories'      => $categories,
            'isAdmin'         => Auth::user()->isAdmin(),
            'summary'         => [
                'total_categories' => $categories->count(),
            ],
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'image'         => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
        ]);

        $this->categoryService->store($validated, $request->file('image'), Auth::id());

        return redirect()->back()->with('success', 'Category created successfully');
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
        ]);

        $this->categoryService->update($category, $validated, $request->file('image'));

        return redirect()->back()->with('success', 'Category updated successfully');
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);

        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Category deleted successfully');
    }
}
