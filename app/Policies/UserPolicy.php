<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any employee accounts.
     */
    public function viewAny(User $actor): bool
    {
        return $actor->isAdmin();
    }

    /**
     * Determine whether the user can view the specific employee.
     */
    public function view(User $actor, User $target): bool
    {
        // Non-super-admins cannot view super admins
        if ($target->isSuperAdmin() && !$actor->isSuperAdmin()) {
            return false;
        }

        return $actor->isAdmin();
    }

    /**
     * Determine whether the user can create an employee account.
     */
    public function create(User $actor): bool
    {
        return $actor->isAdmin();
    }

    /**
     * Determine whether the user can update the specific employee.
     */
    public function update(User $actor, User $target): bool
    {
        // Non-super-admins cannot update super admins
        if ($target->isSuperAdmin() && !$actor->isSuperAdmin()) {
            return false;
        }

        return $actor->isAdmin();
    }

    /**
     * Determine whether the user can delete the specific employee.
     */
    public function delete(User $actor, User $target): bool
    {
        // Cannot delete self
        if ($actor->id === $target->id) {
            return false;
        }

        // Non-super-admins cannot delete super admins
        if ($target->isSuperAdmin() && !$actor->isSuperAdmin()) {
            return false;
        }

        return $actor->isAdmin();
    }

    /**
     * Determine whether the user can assign a specific role.
     */
    public function assignRole(User $actor, string $role): bool
    {
        // Only Super Admin can assign the Super Admin role
        if ($role === User::ROLE_SUPER_ADMIN && !$actor->isSuperAdmin()) {
            return false;
        }

        return $actor->isAdmin();
    }
}
