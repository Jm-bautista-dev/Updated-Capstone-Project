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

    /**
     * Get the standardized base unit for a given input unit.
     */
    public static function normalizeUnit(string $unit): string
    {
        return match (strtolower($unit)) {
            'kg', 'g', 'grams' => 'g',
            'l', 'liters', 'ml', 'milliliters' => 'ml',
            default => 'pcs',
        };
    }

    /**
     * Convert a quantity and unit to its base unit equivalent.
     */
    public static function convertToBaseQuantity(float $quantity, string $unit): float
    {
        return match (strtolower($unit)) {
            'kg' => self::kgToG($quantity),
            'l', 'liters' => self::lToMl($quantity),
            default => $quantity,
        };
    }

    /**
     * Get a list of allowed units for validation.
     */
    public static function getAllowedUnits(): array
    {
        return ['g', 'ml', 'pcs', 'kg', 'L', 'liters'];
    }
}
