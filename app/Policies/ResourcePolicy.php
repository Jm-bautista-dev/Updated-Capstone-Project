<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class ResourcePolicy
{
    /**
     * Determine if the user can view the model.
     */
    public function view(User $user, $model): bool
    {
        return $user->isAdmin() || $model->branch_id === $user->branch_id;
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
