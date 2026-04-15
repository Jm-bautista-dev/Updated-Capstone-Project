/**
 * Unit Conversion Engine (JS Version)
 * Mirroring app/Utils/UnitConverter.php
 */

export const normalizeUnit = (unit: string): string => {
  const u = unit.toLowerCase().trim();
  if (['kg', 'g', 'grams'].includes(u)) return 'g';
  if (['l', 'liters', 'ml', 'milliliters'].includes(u)) return 'ml';
  return 'pcs';
};

export const convertToBaseQuantity = (quantity: number, unit: string): number => {
  const u = unit.toLowerCase().trim();
  if (u === 'kg') return quantity * 1000;
  if (u === 'l' || u === 'liters') return quantity * 1000;
  return quantity;
};

export const convertToBaseQuantityWithIngredient = (
  quantity: number,
  unit: string,
  baseUnit: string,
  avgWeight?: number | null
): number => {
  const u = unit.toLowerCase().trim();
  const b = baseUnit.toLowerCase().trim();

  // If the units already match (e.g., g -> g, ml -> ml, pcs -> pcs)
  if (u === b || normalizeUnit(u) === b) {
    return convertToBaseQuantity(quantity, u);
  }

  // Piece-based conversion logic
  const pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'half', 'whole'];
  if (pieceUnits.includes(u)) {
    let multiplier = 1;
    if (u === 'half') multiplier = 0.5;
    
    if (avgWeight && avgWeight > 0) {
      return Number((quantity * multiplier * avgWeight).toFixed(4));
    }
  }

  return convertToBaseQuantity(quantity, u);
};

export const getAllowedUnits = (): string[] => {
  return ['g', 'ml', 'pcs', 'kg', 'l', 'liters', 'cloves', 'clove', 'half', 'whole'];
};
