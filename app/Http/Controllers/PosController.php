<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index()
    {
        // Sample orders - in production, fetch from your DB
        $orders = [
            [
                'id' => 1,
                'order_number' => 'POS-001',
                'type' => 'Dine-in',
                'items' => [
                    ['name' => 'Burger', 'quantity' => 2, 'price' => 5.99],
                    ['name' => 'Fries', 'quantity' => 1, 'price' => 2.99],
                ],
                'total' => 14.97,
                'status' => 'pending',
                'payment_method' => null,
                'paid_amount' => 0,
            ],
            [
                'id' => 2,
                'order_number' => 'POS-002',
                'type' => 'Take-out',
                'items' => [
                    ['name' => 'Pizza', 'quantity' => 1, 'price' => 8.99],
                ],
                'total' => 8.99,
                'status' => 'completed',
                'payment_method' => 'cash',
                'paid_amount' => 8.99,
            ],
        ];

        return Inertia::render('Pos/Index', [
            'orders' => $orders,
        ]);
    }
}
