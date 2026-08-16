/**
 * Unit Conversion Engine (TypeScript Version)
 * Mirroring app/Utils/UnitConverter.php
 */

export const getMeasurementFamily = (unit: string): 'mass' | 'volume' | 'count' | null => {
  const u = unit.toLowerCase().trim();
  if (['mg', 'milligram', 'milligrams', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms'].includes(u)) {
    return 'mass';
  }
  if (['ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters'].includes(u)) {
    return 'volume';
  }
  if ([
    'pcs', 'pc', 'piece', 'pieces',
    'box', 'bottle', 'pack', 'sack',
    'cloves', 'clove', 'slice', 'slices',
    'half', 'whole'
  ].includes(u)) {
    return 'count';
  }
  return null;
};

export const areUnitsCompatible = (unit1: string, unit2: string, avgWeightPerPiece?: number | null): boolean => {
  const family1 = getMeasurementFamily(unit1);
  const family2 = getMeasurementFamily(unit2);

  if (!family1 || !family2) return false;
  if (family1 === family2) return true;

  if ((family1 === 'count' || family2 === 'count') && avgWeightPerPiece && avgWeightPerPiece > 0) {
    return true;
  }

  return false;
};

export const getCompatibleUnits = (unit: string): string[] => {
  const family = getMeasurementFamily(unit);
  if (family === 'mass') return ['mg', 'g', 'kg'];
  if (family === 'volume') return ['ml', 'L'];
  if (family === 'count') return ['pcs', 'cloves', 'half', 'whole'];
  return ['pcs'];
};

export const getDefaultRecipeUnit = (inventoryUnit: string): string => {
  const family = getMeasurementFamily(inventoryUnit);
  if (family === 'mass') return 'g';
  if (family === 'volume') return 'ml';
  if (family === 'count') return 'pcs';
  return 'pcs';
};

export const normalizeUnit = (unit: string): string => {
  const family = getMeasurementFamily(unit);
  if (family === 'mass') return 'g';
  if (family === 'volume') return 'ml';
  if (family === 'count') return 'pcs';
  return unit.toLowerCase().trim();
};

export const convertToBaseQuantity = (quantity: number, unit: string): number => {
  const u = unit.toLowerCase().trim();
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return quantity * 1000;
  if (u === 'mg' || u === 'milligram' || u === 'milligrams') return quantity / 1000;
  if (u === 'l' || u === 'liter' || u === 'liters') return quantity * 1000;
  if (u === 'half') return quantity * 0.5;
  return quantity;
};

export const convertFromBaseQuantity = (baseQuantity: number, targetUnit: string): number => {
  const u = targetUnit.toLowerCase().trim();
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return baseQuantity / 1000;
  if (u === 'mg' || u === 'milligram' || u === 'milligrams') return baseQuantity * 1000;
  if (u === 'l' || u === 'liter' || u === 'liters') return baseQuantity / 1000;
  if (u === 'half') return baseQuantity * 2.0;
  return baseQuantity;
};

export const convertQuantity = (
  quantity: number,
  fromUnit: string,
  toUnit: string,
  avgWeight?: number | null
): number => {
  const from = fromUnit.toLowerCase().trim();
  const to = toUnit.toLowerCase().trim();

  if (from === to) return quantity;

  const familyFrom = getMeasurementFamily(from);
  const familyTo = getMeasurementFamily(to);

  const pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'slice', 'slices', 'half', 'whole'];

  // Piece to Mass/Volume conversion
  if (pieceUnits.includes(from) && (familyTo === 'mass' || familyTo === 'volume')) {
    const effectiveQty = from === 'half' ? quantity * 0.5 : quantity;
    const baseQty = avgWeight && avgWeight > 0 ? effectiveQty * avgWeight : effectiveQty;
    return convertFromBaseQuantity(baseQty, to);
  }

  // Mass/Volume to Piece conversion
  if ((familyFrom === 'mass' || familyFrom === 'volume') && pieceUnits.includes(to)) {
    const baseQty = convertToBaseQuantity(quantity, from);
    if (avgWeight && avgWeight > 0) {
      const pieces = baseQty / avgWeight;
      return to === 'half' ? pieces * 2 : pieces;
    }
    return baseQty;
  }

  // Same family conversion
  const baseQuantity = convertToBaseQuantity(quantity, from);
  return convertFromBaseQuantity(baseQuantity, to);
};

export const convertToBaseQuantityWithIngredient = (
  quantity: number,
  unit: string,
  baseUnit: string,
  avgWeight?: number | null
): number => {
  const fromUnit = unit.toLowerCase().trim();
  const targetBase = normalizeUnit(baseUnit);
  return convertQuantity(quantity, fromUnit, targetBase, avgWeight);
};

export const getAllowedUnits = (): string[] => {
  return [
    'mg', 'g', 'kg',
    'ml', 'l', 'L', 'liters',
    'pcs', 'pc', 'pieces',
    'box', 'bottle', 'pack', 'sack',
    'cloves', 'clove', 'half', 'whole'
  ];
};
