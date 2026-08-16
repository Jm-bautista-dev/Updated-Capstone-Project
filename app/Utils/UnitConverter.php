<?php

namespace App\Utils;

class UnitConverter
{
    /**
     * Get the measurement family of a unit ('mass', 'volume', 'count').
     */
    public static function getMeasurementFamily(string $unit): ?string
    {
        $u = strtolower(trim($unit));

        return match ($u) {
            'mg', 'milligram', 'milligrams',
            'g', 'gram', 'grams',
            'kg', 'kilogram', 'kilograms' => 'mass',

            'ml', 'milliliter', 'milliliters',
            'l', 'liter', 'liters' => 'volume',

            'pcs', 'pc', 'piece', 'pieces',
            'box', 'bottle', 'pack', 'sack',
            'cloves', 'clove', 'slice', 'slices',
            'half', 'whole' => 'count',

            default => null,
        };
    }

    /**
     * Check if two units are compatible for conversion.
     */
    public static function areUnitsCompatible(string $unit1, string $unit2, ?float $avgWeightPerPiece = null): bool
    {
        $family1 = self::getMeasurementFamily($unit1);
        $family2 = self::getMeasurementFamily($unit2);

        if (!$family1 || !$family2) {
            return false;
        }

        // Same measurement family is always compatible
        if ($family1 === $family2) {
            return true;
        }

        // Cross-family bridge: Count <-> Mass/Volume requires avgWeightPerPiece
        if (($family1 === 'count' || $family2 === 'count') && $avgWeightPerPiece && $avgWeightPerPiece > 0) {
            return true;
        }

        return false;
    }

    /**
     * Get allowed compatible units for a given inventory/ingredient unit.
     */
    public static function getCompatibleUnits(string $unit): array
    {
        $family = self::getMeasurementFamily($unit);

        return match ($family) {
            'mass'   => ['mg', 'g', 'kg'],
            'volume' => ['ml', 'L'],
            'count'  => ['pcs', 'cloves', 'half', 'whole'],
            default  => ['pcs'],
        };
    }

    /**
     * Get the intelligent default recipe unit for an inventory unit.
     */
    public static function getDefaultRecipeUnit(string $inventoryUnit): string
    {
        $family = self::getMeasurementFamily($inventoryUnit);

        return match ($family) {
            'mass'   => 'g',
            'volume' => 'ml',
            'count'  => 'pcs',
            default  => 'pcs',
        };
    }

    /**
     * Convert Kilograms to Grams.
     */
    public static function kgToG(float $kg): float
    {
        return round($kg * 1000, 6);
    }

    /**
     * Convert Grams to Kilograms.
     */
    public static function gToKg(float $g): float
    {
        return round($g / 1000, 6);
    }

    /**
     * Convert Milligrams to Grams.
     */
    public static function mgToG(float $mg): float
    {
        return round($mg / 1000, 6);
    }

    /**
     * Convert Grams to Milligrams.
     */
    public static function gToMg(float $g): float
    {
        return round($g * 1000, 6);
    }

    /**
     * Convert Liters to Milliliters.
     */
    public static function lToMl(float $l): float
    {
        return round($l * 1000, 6);
    }

    /**
     * Convert Milliliters to Liters.
     */
    public static function mlToL(float $ml): float
    {
        return round($ml / 1000, 6);
    }

    /**
     * Standardize a unit to the canonical base unit of its measurement family.
     * Mass -> 'g', Volume -> 'ml', Count -> 'pcs'.
     */
    public static function normalizeUnit(string $unit): string
    {
        $family = self::getMeasurementFamily($unit);

        return match ($family) {
            'mass'   => 'g',
            'volume' => 'ml',
            'count'  => 'pcs',
            default  => strtolower(trim($unit)),
        };
    }

    /**
     * Calculate cost per canonical base unit from total purchase cost and base quantity.
     * Formula: cost_per_base_unit = total_cost / quantity_in_base_units.
     */
    public static function normalizeCostPerBaseUnit(float $totalCost, float $baseQuantity): float
    {
        if ($baseQuantity <= 0 || $totalCost <= 0) {
            return 0.0;
        }

        return round($totalCost / $baseQuantity, 6);
    }

    /**
     * Convert a quantity and unit to its canonical base unit equivalent (g, ml, pcs).
     */
    public static function convertToBaseQuantity(float $quantity, string $unit): float
    {
        $u = strtolower(trim($unit));

        return match ($u) {
            'kg', 'kilogram', 'kilograms' => self::kgToG($quantity),
            'mg', 'milligram', 'milligrams' => self::mgToG($quantity),
            'l', 'liter', 'liters' => self::lToMl($quantity),
            'half' => $quantity * 0.5,
            default => $quantity,
        };
    }

    /**
     * Convert from canonical base quantity (g, ml, pcs) to target unit.
     */
    public static function convertFromBaseQuantity(float $baseQuantity, string $targetUnit): float
    {
        $u = strtolower(trim($targetUnit));

        return match ($u) {
            'kg', 'kilogram', 'kilograms' => self::gToKg($baseQuantity),
            'mg', 'milligram', 'milligrams' => self::gToMg($baseQuantity),
            'l', 'liter', 'liters' => self::mlToL($baseQuantity),
            'half' => $baseQuantity * 2.0,
            default => $baseQuantity,
        };
    }

    /**
     * Convert a quantity from one unit to another compatible unit.
     */
    public static function convertQuantity(float $quantity, string $fromUnit, string $toUnit, ?float $avgWeight = null): float
    {
        $from = strtolower(trim($fromUnit));
        $to = strtolower(trim($toUnit));

        if ($from === $to) {
            return $quantity;
        }

        $familyFrom = self::getMeasurementFamily($from);
        $familyTo = self::getMeasurementFamily($to);

        // Piece to Mass/Volume conversion via average piece weight
        $pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'slice', 'slices', 'half', 'whole'];
        if (in_array($from, $pieceUnits) && ($familyTo === 'mass' || $familyTo === 'volume')) {
            $effectiveQty = ($from === 'half') ? ($quantity * 0.5) : $quantity;
            $baseQty = ($avgWeight && $avgWeight > 0) ? ($effectiveQty * $avgWeight) : $effectiveQty;
            return self::convertFromBaseQuantity($baseQty, $to);
        }

        // Mass/Volume to Piece conversion via average piece weight
        if (($familyFrom === 'mass' || $familyFrom === 'volume') && in_array($to, $pieceUnits)) {
            $baseQty = self::convertToBaseQuantity($quantity, $from);
            if ($avgWeight && $avgWeight > 0) {
                $pieces = $baseQty / $avgWeight;
                return ($to === 'half') ? ($pieces * 2) : $pieces;
            }
            return $baseQty;
        }

        // Same family conversion: convert to canonical base, then to target unit
        $baseQuantity = self::convertToBaseQuantity($quantity, $from);
        return self::convertFromBaseQuantity($baseQuantity, $to);
    }

    /**
     * Convert a quantity given in a specific unit to the ingredient's canonical base unit.
     */
    public static function convertToBaseQuantityWithIngredient(
        float $quantity,
        string $unit,
        string $baseUnit,
        ?float $avgWeight = null
    ): float {
        $fromUnit = strtolower(trim($unit));
        $targetBase = self::normalizeUnit($baseUnit);

        // Convert directly using universal converter
        return self::convertQuantity($quantity, $fromUnit, $targetBase, $avgWeight);
    }

    /**
     * Get a list of all allowed units across the application.
     */
    public static function getAllowedUnits(): array
    {
        return [
            'mg', 'g', 'kg',
            'ml', 'l', 'L', 'liters',
            'pcs', 'pc', 'pieces',
            'box', 'bottle', 'pack', 'sack',
            'cloves', 'clove', 'half', 'whole'
        ];
    }
}
