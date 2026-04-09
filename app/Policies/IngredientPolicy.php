<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Ingredient;
use Illuminate\Auth\Access\Response;

class IngredientPolicy
{
    /**
     * Determine if the user can view the model.
     */
    public function view(User $user, Ingredient $ingredient): bool
    {
        return $user->isAdmin() || $ingredient->branch_id === $user->branch_id;
    }

    /**
     * Determine if the user can create models (Administrative definition).
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the model (Structural definition/adjustment).
     */
    public function update(User $user, Ingredient $ingredient): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the model.
     */
    public function delete(User $user, Ingredient $ingredient): bool
    {
        return $user->isAdmin();
    }
}
