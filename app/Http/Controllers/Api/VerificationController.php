<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailVerification;
use App\Mail\SendOtpMail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class VerificationController extends Controller
{
    /**
     * Send OTP to the provided customer email address.
     * POST /api/v1/send-otp
     */
    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($request->email));
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store or update OTP record for this specific customer email
        EmailVerification::updateOrCreate(
            ['email' => $email],
            [
                'otp' => $otp,
                'expires_at' => now()->addMinutes(5),
                'is_verified' => false
            ]
        );

        Log::info('[OTP SYSTEM] OTP Generated', [
            'customer_email'  => $email,
            'recipient_email' => $email,
            'otp'             => $otp,
            'expires_at'      => now()->addMinutes(5)->toDateTimeString(),
            'ip'              => $request->ip(),
        ]);

        try {
            // Explicitly send email ONLY to the customer's requested email address
            Mail::to($email)->send(new SendOtpMail($otp));

            Log::info('[OTP SYSTEM] Verification Mail Dispatched', [
                'customer_email'  => $email,
                'recipient_email' => $email,
                'mail_status'     => 'SUCCESS',
            ]);
        } catch (\Exception $e) {
            Log::error('[OTP SYSTEM] Verification Mail Dispatch Failed', [
                'customer_email'  => $email,
                'recipient_email' => $email,
                'mail_status'     => 'FAILED',
                'error_message'   => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP email. Please check your email address or SMTP configuration.',
                'error'   => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully to ' . $email
        ]);
    }

    /**
     * Verify the provided OTP for a specific customer email.
     * POST /api/v1/verify-otp
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|max:255',
            'otp'   => 'required|string|size:6',
        ]);

        $email = strtolower(trim($request->email));
        $submittedOtp = trim($request->otp);

        $record = EmailVerification::where('email', $email)->first();

        if (!$record || $record->otp !== $submittedOtp) {
            Log::warning('[OTP SYSTEM] Invalid OTP Verification Attempt', [
                'customer_email' => $email,
                'submitted_otp'  => $submittedOtp,
                'ip'             => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code'
            ], 400);
        }

        if (now()->greaterThan($record->expires_at)) {
            Log::warning('[OTP SYSTEM] Expired OTP Verification Attempt', [
                'customer_email' => $email,
                'expires_at'     => $record->expires_at->toDateTimeString(),
                'ip'             => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'OTP code has expired. Please request a new code.'
            ], 400);
        }

        $record->update(['is_verified' => true]);

        Log::info('[OTP SYSTEM] Email Verified Successfully', [
            'customer_email' => $email,
            'ip'             => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email verified successfully'
        ]);
    }
}
