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
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();

        // Determine branch filter
        if ($user->isAdmin()) {
            $branchId = $request->input('branch_id');
        } else {
            $branchId = $user->branch_id;
        }

        $query = Category::query()->with(['branches'])->withCount('products');

        if ($branchId) {
            $query->whereHas('branches', function($q) use ($branchId) {
                $q->where('branches.id', $branchId);
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $categories = $query->orderBy('name')->get()->map(function (Category $category) {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $category->image_url = $category->image_path
                ? asset('storage/' . $category->image_path)
                : null;
            return $category;
        });

        return Inertia::render('Categories/Index', [
            'categories'      => $categories,
            'branches'        => $branches,
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
            'summary'         => [
                'total_categories' => $categories->count(),
            ],
            'filters' => $request->only(['search', 'branch_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'branch_ids'  => 'nullable|array',
            'branch_ids.*'=> 'exists:branches,id',
        ]);

        $this->categoryService->store($validated, $request->file('image'), Auth::id());

        return redirect()->back();
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $this->authorize('update', $category);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'branch_ids'  => 'nullable|array',
            'branch_ids.*'=> 'exists:branches,id',
        ]);

        $this->categoryService->update($category, $validated, $request->file('image'));

        return redirect()->back();
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $this->authorize('delete', $category);

        if ($category->image_path) {
            Storage::disk('public')->delete($category->image_path);
        }

        $category->delete();

        return redirect()->back();
    }
}
