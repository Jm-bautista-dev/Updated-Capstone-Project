<?php

namespace App\Http\Controllers;

use App\Models\CashierShift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CashierShiftController extends Controller
{
    public function open(Request $request)
    {
        $request->validate([
            'opening_balance' => 'required|numeric|min:0',
        ]);

        $user = Auth::user();

        // Check if there's already an open shift
        $existingShift = CashierShift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->first();

        if ($existingShift) {
            return back()->withErrors(['shift' => 'You already have an active shift.']);
        }

        CashierShift::create([
            'cashier_id' => $user->id,
            'branch_id' => $user->branch_id,
            'opening_balance' => $request->opening_balance,
            'expected_balance' => $request->opening_balance,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        return back()->with('success', 'Shift opened successfully.');
    }

    public function close(Request $request)
    {
        $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        $shift = CashierShift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->firstOrFail();

        $variance = $request->closing_balance - $shift->expected_balance;

        if ($variance != 0 && empty($request->notes)) {
            return back()->withErrors(['notes' => 'Please provide a reason for the variance.']);
        }

        $shift->update([
            'closing_balance' => $request->closing_balance,
            'variance' => $variance,
            'notes' => $request->notes,
            'status' => 'closed',
            'closed_at' => now(),
        ]);

        return back()->with('success', 'Shift closed successfully.');
    }

    public function adjust(Request $request)
    {
        $request->validate([
            'type' => 'required|in:in,out',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'required|string',
        ]);

        $user = Auth::user();
        $shift = CashierShift::where('cashier_id', $user->id)
            ->where('status', 'open')
            ->firstOrFail();

        if ($request->type === 'in') {
            $shift->increment('cash_in', $request->amount);
            $shift->increment('expected_balance', $request->amount);
        } else {
            $shift->increment('cash_out', $request->amount);
            $shift->decrement('expected_balance', $request->amount);
        }

        $shift->notes .= "\n[" . strtoupper($request->type) . "] " . number_format($request->amount, 2) . ": " . $request->notes;
        $shift->save();

        return back()->with('success', 'Cash adjustment recorded.');
    }
}
