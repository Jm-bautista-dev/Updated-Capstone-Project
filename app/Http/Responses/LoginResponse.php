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

        // Cashiers always go to POS — never use session's url.intended
        if ($user->role === 'cashier') {
            return $request->wantsJson()
                ? response()->json(['two_factor' => false])
                : redirect('/pos');
        }

        // Admins go to url.intended if set, otherwise dashboard
        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->intended('/dashboard');
    }
}
