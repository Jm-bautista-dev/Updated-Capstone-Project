<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        // Mandatory Password Change check
        if ($user->must_change_password) {
            return $request->wantsJson()
                ? response()->json(['two_factor' => false, 'redirect' => '/change-password'])
                : redirect('/change-password');
        }

        // Redirect based on role
        if ($user->role === 'admin') {
            return $request->wantsJson()
                ? response()->json(['two_factor' => false])
                : redirect()->intended('/dashboard');
        }

        if ($user->role === 'cashier') {
            return $request->wantsJson()
                ? response()->json(['two_factor' => false])
                : redirect()->intended('/pos');
        }

        // Customers or other roles go to menu / home page
        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->intended('/menu');
    }
}
