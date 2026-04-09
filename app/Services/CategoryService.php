<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CategoryService
{
    /**
     * Store a new category and sync its branches.
     */
    public function store(array $validated, $image = null, ?int $creatorId = null): Category
    {
        return DB::transaction(function () use ($validated, $image, $creatorId) {
            $imagePath = null;
            if ($image) {
                $imagePath = $image->store('categories', 'public');
            }

            $category = Category::create([
                'name'        => $validated['name'],
                'description' => $validated['description'] ?? null,
                'image_path'  => $imagePath,
                'created_by'  => $creatorId,
            ]);

            // Sync branches
            $this->syncBranches($category, $validated['branch_ids'] ?? []);

            return $category->load('branches');
        });
    }

    /**
     * Update an existing category and sync its branches.
     */
    public function update(Category $category, array $validated, $image = null): Category
    {
        return DB::transaction(function () use ($category, $validated, $image) {
            $imagePath = $category->image_path;

            if ($image) {
                if ($category->image_path) {
                    Storage::disk('public')->delete($category->image_path);
                }
                $imagePath = $image->store('categories', 'public');
            }

            $category->update([
                'name'        => $validated['name'],
                'description' => $validated['description'] ?? null,
                'image_path'  => $imagePath,
            ]);

            // Sync branches
            $this->syncBranches($category, $validated['branch_ids'] ?? []);

            return $category->load('branches');
        });
    }

    /**
     * Sync branches for a category.
     * If no branches provided, sync to ALL existing branches.
     */
    protected function syncBranches(Category $category, array $branchIds): void
    {
        if (empty($branchIds)) {
            // Default to ALL branches
            $branchIds = Branch::pluck('id')->toArray();
        }

        $category->branches()->sync($branchIds);
    }
}
