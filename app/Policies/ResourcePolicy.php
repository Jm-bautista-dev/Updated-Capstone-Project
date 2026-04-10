<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class ResourcePolicy
{
    public function view(User $user, $model): bool
    {
        return $user->isAdmin() || $model->branch_id === $user->branch_id;
    }

    /**
     * Determine if the user can create the model.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the model.
     */
    public function update(User $user, $model): bool
    {
        return $user->isAdmin() || $model->branch_id === $user->branch_id;
    }

    /**
     * Determine if the user can delete the model.
     */
    public function delete(User $user, $model): bool
    {
        return $user->isAdmin() || $model->branch_id === $user->branch_id;
    }
}
