<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Branch-specific order channel
Broadcast::channel('branch.{id}.orders', function ($user, $id) {
    if (!$user || !preg_match('/^\d+$/', (string) $id)) return false;
    if ($user->isAdmin()) return true;
    return (int) $user->branch_id === (int) $id;
});

// Admin-wide order channel
Broadcast::channel('admin.orders', function ($user) {
    if (!$user) return false;
    return $user->isAdmin();
});

// Branch-specific general channel (POS/Sales/Inventory)
Broadcast::channel('branch.{id}', function ($user, $id) {
    if (!$user || !preg_match('/^\d+$/', (string) $id)) return false;
    if ($user->isAdmin()) return true;
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
    if (!$order) {
        return false;
    }

    return (int) $order->user_id === (int) $user->id
        || (int) $order->rider_id === (int) $user->id
        || (int) ($order->customer_id ?? 0) === (int) $user->id;
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

// Customer-scoped user channel (push notification broadcast target)
Broadcast::channel('customer.{userId}', function ($user, $userId) {
    if (!$user) return false;
    if (method_exists($user, 'isAdmin') && $user->isAdmin()) return true;
    return (int) $user->id === (int) $userId;
});

