<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class EmployeeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/Employees/Index', [
            'employees' => User::with('branch')
                ->where('id', '!=', Auth::id())
                ->where('role', '!=', User::ROLE_CUSTOMER)
                ->latest()
                ->get(),
            'branches'  => Branch::orderBy('name')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[A-Za-z\s]+$/'
            ],
            'email'     => 'required|string|email|max:100|unique:users',
            'password'  => 'required|string|min:8|max:100',
            'role'      => 'required|string|in:admin,cashier',
            'branch_id' => 'required|exists:branches,id',
        ], [
            'name.regex' => 'Full name must only contain letters and spaces.',
            'branch_id.required' => 'Please select an assigned branch.',
        ]);

        User::create([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'password'  => Hash::make($validated['password']),
            'role'      => $validated['role'],
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        return back()->with('success', 'Employee created successfully');
    }

    public function update(Request $request, User $employee)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'regex:/^[A-Za-z\s]+$/'
            ],
            'email'     => 'required|string|email|max:100|unique:users,email,' . $employee->id,
            'password'  => 'nullable|string|min:8|max:100',
            'role'      => 'required|string|in:admin,cashier',
            'branch_id' => 'required|exists:branches,id',
        ], [
            'name.regex' => 'Full name must only contain letters and spaces.',
            'branch_id.required' => 'Please select an assigned branch.',
        ]);

        $employee->update([
            'name'      => $validated['name'],
            'email'     => $validated['email'],
            'role'      => $validated['role'],
            'branch_id' => $validated['branch_id'] ?? null,
        ]);

        if ($request->filled('password')) {
            $employee->update(['password' => Hash::make($validated['password'])]);
        }

        return back()->with('success', 'Employee updated successfully');
    }

    public function destroy(User $employee)
    {
        if ($employee->id === Auth::id()) {
            return back()->with('error', 'You cannot delete yourself');
        }

        $employee->delete();
        return back()->with('success', 'Employee deleted successfully');
    }
}
