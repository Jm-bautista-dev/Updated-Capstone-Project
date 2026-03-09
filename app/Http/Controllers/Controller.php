<?php

namespace App\Http\Controllers;
use inertia\Inertia;

abstract class Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }
}
