<?php

namespace App\Services;

class PhoneNumberService
{
    /**
     * Normalize a Philippine phone number into canonical local mobile format: 09XXXXXXXXX (11 digits).
     *
     * Handles:
     * - '+639171234567' -> '09171234567'
     * - '639171234567'  -> '09171234567'
     * - '9171234567'    -> '09171234567'
     * - '0917-123-4567' -> '09171234567'
     * - '0917 123 4567' -> '09171234567'
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $cleaned = trim($phone);
        if ($cleaned === '') {
            return null;
        }

        // Strip everything except digits
        $digits = preg_replace('/\D+/', '', $cleaned);

        // Match any Philippine mobile number format:
        // Optional international prefix: 0063, 63, or none
        // Optional leading 0 (common when users or pickers combine +63 and 09, e.g. +6309...)
        // Followed by 9 and exactly 9 digits (total 10 subscriber digits)
        if (preg_match('/^(?:0063|63)?0?(9\d{9})$/', $digits, $matches)) {
            return '0' . $matches[1];
        }

        // If not matching valid mobile shapes, return cleaned digits as best effort
        return $digits !== '' ? $digits : null;
    }

    /**
     * Validate whether the number is a valid Philippine mobile number.
     * Must be 11 digits starting with 09.
     */
    public static function isValidPhMobile(?string $phone): bool
    {
        $normalized = self::normalize($phone);
        if ($normalized === null) {
            return false;
        }

        return (bool) preg_match('/^09\d{9}$/', $normalized);
    }

    /**
     * Format a phone number into international E.164-style display format: +63 9XX XXX XXXX
     */
    public static function formatInternational(?string $phone): ?string
    {
        $normalized = self::normalize($phone);
        if (!$normalized || strlen($normalized) !== 11) {
            return $phone;
        }

        // '09171234567' -> '+63 917 123 4567'
        return '+63 ' . substr($normalized, 1, 3) . ' ' . substr($normalized, 4, 3) . ' ' . substr($normalized, 7);
    }

    /**
     * Mask a phone number for safe public API exposure: +63 917 *** 4567
     */
    public static function mask(?string $phone): string
    {
        $normalized = self::normalize($phone);
        if (!$normalized || strlen($normalized) !== 11) {
            return '***';
        }

        return '+63 ' . substr($normalized, 1, 3) . ' *** ' . substr($normalized, -4);
    }
}
