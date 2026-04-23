<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Branch-specific order channel
Broadcast::channel('branch.{id}.orders', function ($user, $id) {
    if ($user->isAdmin()) return true;
    return (int) $user->branch_id === (int) $id;
});

// Admin-wide order channel
Broadcast::channel('admin.orders', function ($user) {
    return $user->isAdmin();
});

Broadcast::channel('branch.{id}', function ($user, $id) {
    // Admin can listen to any branch
    if ($user->isAdmin()) {
        return true;
    }
    // Cashiers only their own branch
    return (int) $user->branch_id === (int) $id;
});
