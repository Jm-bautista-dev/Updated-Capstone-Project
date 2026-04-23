<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailVerification;
use App\Mail\SendOtpMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class VerificationController extends Controller
{
    /**
     * Send OTP to the provided email.
     * POST /api/v1/send-otp
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        EmailVerification::updateOrCreate(
            ['email' => $request->email],
            [
                'otp' => $otp,
                'expires_at' => now()->addMinutes(5),
                'is_verified' => false
            ]
        );

        try {
            Mail::to($request->email)->send(new SendOtpMail($otp));
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP. Please check your SMTP settings.',
                'error' => $e->getMessage()
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully to ' . $request->email
        ]);
    }

    /**
     * Verify the provided OTP.
     * POST /api/v1/verify-otp
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $record = EmailVerification::where('email', $request->email)->first();

        if (!$record || $record->otp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP'
            ], 400);
        }

        if (now()->greaterThan($record->expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'OTP has expired'
            ], 400);
        }

        $record->update(['is_verified' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully'
        ]);
    }
}
