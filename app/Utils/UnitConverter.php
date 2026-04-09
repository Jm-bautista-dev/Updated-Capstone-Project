<?php

namespace App\Utils;

class UnitConverter
{
    /**
     * Convert Kilograms to Grams.
     */
    public static function kgToG(float $kg): float
    {
        return round($kg * 1000, 4);
    }

    /**
     * Convert Grams to Kilograms.
     */
    public static function gToKg(float $g): float
    {
        return round($g / 1000, 4);
    }

    /**
     * Convert Liters to Milliliters.
     */
    public static function lToMl(float $l): float
    {
        return round($l * 1000, 4);
    }

    /**
     * Convert Milliliters to Liters.
     */
    public static function mlToL(float $ml): float
    {
        return round($ml / 1000, 4);
    }
}
