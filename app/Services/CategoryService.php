<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Branch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Events\CategoryUpdated;

class CategoryService
{
    public function store(array $validated, $image = null, ?int $creatorId = null): void
    {
        DB::transaction(function () use ($validated, $image, $creatorId) {
            $imagePath = null;
            if ($image) {
                $imagePath = $image->store('categories', 'public');
            }

            Category::create([
                'name'        => $validated['name'],
                'description' => $validated['description'] ?? null,
                'image_path'  => $imagePath,
                'created_by'  => $creatorId,
            ]);

            // 🔥 BROADCAST: Global category sync
            broadcast(new CategoryUpdated(0))->toOthers(); // 0 means refresh all
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
            ]);

            // 🔥 BROADCAST: Global category sync
            broadcast(new CategoryUpdated($category->id))->toOthers();

            return $category;
        });
    }
}
