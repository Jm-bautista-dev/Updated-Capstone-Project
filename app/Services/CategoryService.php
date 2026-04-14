<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CategoryService
{
    /**
     * Store a new category.
     * Supports "Both Branch" via branch_option.
     */
    public function store(array $validated, $image = null, ?int $creatorId = null): void
    {
        DB::transaction(function () use ($validated, $image, $creatorId) {
            $imagePath = null;
            if ($image) {
                $imagePath = $image->store('categories', 'public');
            }

            $branchOption = $validated['branch_option'] ?? 'single';
            $branchIds = [];

            if ($branchOption === 'both') {
                $branchIds = Branch::pluck('id')->toArray();
            } else {
                $branchIds = [$validated['branch_id']];
            }

            foreach ($branchIds as $branchId) {
                Category::create([
                    'name'        => $validated['name'],
                    'description' => $validated['description'] ?? null,
                    'image_path'  => $imagePath,
                    'branch_id'   => $branchId,
                    'created_by'  => $creatorId,
                ]);
            }
        });
    }

    /**
     * Update an existing category.
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
                'branch_id'   => $validated['branch_id'] ?? $category->branch_id,
            ]);

            return $category;
        });
    }
}
