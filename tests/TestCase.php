<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

/**
 * @property \App\Models\Branch $branch
 * @property \App\Models\User $user
 * @property \App\Models\Category $category
 */
abstract class TestCase extends BaseTestCase
{
    public $branch;
    public $user;
    public $category;
}
