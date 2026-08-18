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

// Customer-scoped private order tracking channel
Broadcast::channel('customer.order.{orderId}', function ($user, $orderId) {
    if (!$user) {
        return false;
    }
    if (method_exists($user, 'isAdmin') && $user->isAdmin()) {
        return true;
    }

    $order = \App\Models\Order::find($orderId);
    return $order && (int) $order->user_id === (int) $user->id;
});

Broadcast::channel('user.{id}', function ($user, $id) {
    if (!$user) return false;
    if (method_exists($user, 'isAdmin') && $user->isAdmin()) return true;
    return (int) $user->id === (int) $id;
});

Broadcast::channel('rider.{id}', function ($user, $id) {
    if (!$user) return false;
    if (method_exists($user, 'isAdmin') && $user->isAdmin()) return true;
    return (int) $user->id === (int) $id;
});

