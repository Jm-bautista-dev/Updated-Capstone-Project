<?php

namespace App\Traits;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;

trait BelongsToBranch
{
    /**
     * Scope a query to only include records for a given branch.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  int  $branchId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Determine if a user is from the same branch as the model.
     *
     * @param \App\Models\User $user
     * @return bool
     */
    public function isFromUserBranch($user): bool
    {
        return $user->isAdmin() || $this->branch_id === $user->branch_id;
    }
}
