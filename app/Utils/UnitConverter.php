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
     * Convert a quantity given in a specific unit to the ingredient's base unit.
     */
    public static function convertToBaseQuantityWithIngredient(float $quantity, string $unit, string $baseUnit, ?float $avgWeight = null): float
    {
        $unit = strtolower(trim($unit));
        $baseUnit = strtolower(trim($baseUnit));

        // If the units already match (e.g., g -> g, ml -> ml, pcs -> pcs)
        if ($unit === $baseUnit || self::normalizeUnit($unit) === $baseUnit) {
            return self::convertToBaseQuantity($quantity, $unit);
        }

        // If trying to convert a piece-based unit (cloves, pcs, slices, half) to weight (g, ml)
        // using the ingredient's average weight per piece.
        $pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'half', 'whole'];
        if (in_array($unit, $pieceUnits)) {
            // Apply half logic if user explicitly chooses 'half' as unit
            if ($unit === 'half') {
                $quantity = $quantity * 0.5;
            }

            if ($avgWeight && $avgWeight > 0) {
                // If base unit is kg/l, we assume avgWeight is in base units, but typically it's in g/ml.
                // Assuming avg_weight_per_piece is stored in the base unit (e.g., 5 for 5g, 150 for 150g).
                return round($quantity * $avgWeight, 4);
            }
        }

        // If it's some other non-standard conversion requested without an avg weight,
        // we just fall back securely without causing zeroing out.
        return self::convertToBaseQuantity($quantity, $unit);
    }

    /**
     * Get a list of allowed units for general application.
     */
    public static function getAllowedUnits(): array
    {
        return ['g', 'ml', 'pcs', 'kg', 'L', 'liters', 'cloves', 'clove', 'half', 'whole'];
    }
}
