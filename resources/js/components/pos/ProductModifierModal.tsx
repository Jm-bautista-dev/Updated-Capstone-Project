import React, { useState, useMemo } from 'react';
import { FiPlus, FiMinus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';

export interface ModifierAddon {
  id: number;
  name: string;
  price: number;
  stock_linked?: boolean;
}

export interface ModifierGroup {
  id: number | string;
  name: string;
  selection_type: 'single' | 'multi';
  is_required: boolean;
  min_selections: number;
  max_selections: number | null;
  addons: ModifierAddon[];
}

export interface ProductForModifier {
  id: number;
  name: string;
  selling_price: number;
  image_url?: string | null;
  stock: number;
  addon_groups?: ModifierGroup[];
  available_addons?: { id: number; name: string; price: number }[];
}

export interface SelectedModifier {
  addon_id: number;
  name: string;
  price: number;
  quantity: number;
  group_id?: number | string;
  group_name?: string;
}

interface ProductModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductForModifier | null;
  onConfirm: (product: ProductForModifier, quantity: number, selectedAddons: SelectedModifier[]) => void;
}

export function ProductModifierModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: ProductModifierModalProps) {
  const [quantity, setQuantity] = useState(1);
  // Keyed by group_id -> Record<addon_id, quantity>
  const [selections, setSelections] = useState<Record<string | number, Record<number, number>>>({});
  const [prevProductKey, setPrevProductKey] = useState<string | null>(null);

  const currentProductKey = isOpen && product ? `${product.id}` : null;
  if (currentProductKey !== prevProductKey) {
    setPrevProductKey(currentProductKey);
    setQuantity(1);
    const initial: Record<string | number, Record<number, number>> = {};
    (product?.addon_groups || []).forEach((group) => {
      initial[group.id] = {};
    });
    setSelections(initial);
  }

  const groups = useMemo(() => {
    if (!product) return [];
    if (product.addon_groups && product.addon_groups.length > 0) {
      return product.addon_groups;
    }
    if (product.available_addons && product.available_addons.length > 0) {
      return [
        {
          id: `direct_${product.id}`,
          name: 'Available Customizations',
          selection_type: 'multi' as const,
          is_required: false,
          min_selections: 0,
          max_selections: null,
          addons: product.available_addons.map((a) => ({
            id: a.id,
            name: a.name,
            price: a.price,
          })),
        },
      ];
    }
    return [];
  }, [product]);

  // Toggle or adjust selection for single vs multi groups
  const handleSingleSelect = (groupId: string | number, addonId: number) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: { [addonId]: 1 },
    }));
  };

  const handleMultiToggle = (groupId: string | number, addon: ModifierAddon, group: ModifierGroup) => {
    setSelections((prev) => {
      const groupSelections = { ...(prev[groupId] || {}) };
      const currentQty = groupSelections[addon.id] || 0;

      if (currentQty > 0) {
        delete groupSelections[addon.id];
      } else {
        const totalSelectedInGroup = Object.values(groupSelections).reduce((a, b) => a + b, 0);
        if (group.max_selections !== null && totalSelectedInGroup >= group.max_selections) {
          if (group.max_selections === 1) {
            return {
              ...prev,
              [groupId]: { [addon.id]: 1 },
            };
          }
          return prev;
        }
        groupSelections[addon.id] = 1;
      }

      return {
        ...prev,
        [groupId]: groupSelections,
      };
    });
  };

  const handleMultiQuantityChange = (groupId: string | number, addonId: number, delta: number, group: ModifierGroup) => {
    setSelections((prev) => {
      const groupSelections = { ...(prev[groupId] || {}) };
      const currentQty = groupSelections[addonId] || 0;
      const nextQty = currentQty + delta;

      if (nextQty <= 0) {
        delete groupSelections[addonId];
      } else {
        const totalOtherSelections = Object.entries(groupSelections).reduce(
          (acc, [id, qty]) => (Number(id) === addonId ? acc : acc + qty),
          0
        );
        if (group.max_selections !== null && totalOtherSelections + nextQty > group.max_selections) {
          return prev;
        }
        groupSelections[addonId] = nextQty;
      }

      return {
        ...prev,
        [groupId]: groupSelections,
      };
    });
  };

  // Validation checks per group
  const groupValidationErrors = useMemo(() => {
    const errors: Record<string | number, string> = {};

    groups.forEach((group) => {
      const groupSelections = selections[group.id] || {};
      const count = Object.values(groupSelections).reduce((a, b) => a + b, 0);

      if (group.is_required && count === 0) {
        errors[group.id] = `This group is required. Please choose at least ${group.min_selections || 1} option.`;
      } else if (group.min_selections > 0 && count < group.min_selections) {
        errors[group.id] = `Please select at least ${group.min_selections} option(s) (currently ${count}).`;
      } else if (group.max_selections !== null && count > group.max_selections) {
        errors[group.id] = `Maximum ${group.max_selections} selection(s) allowed for this group.`;
      }
    });

    return errors;
  }, [groups, selections]);

  const isValid = Object.keys(groupValidationErrors).length === 0;

  // Flattened selected add-ons
  const flattenedSelectedAddons = useMemo<SelectedModifier[]>(() => {
    const result: SelectedModifier[] = [];

    groups.forEach((group) => {
      const groupSelections = selections[group.id] || {};
      group.addons.forEach((addon) => {
        const qty = groupSelections[addon.id] || 0;
        if (qty > 0) {
          result.push({
            addon_id: addon.id,
            name: addon.name,
            price: addon.price,
            quantity: qty,
            group_id: group.id,
            group_name: group.name,
          });
        }
      });
    });

    return result;
  }, [groups, selections]);

  const addonsSubtotalPerUnit = useMemo(() => {
    return flattenedSelectedAddons.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [flattenedSelectedAddons]);

  if (!product) return null;

  const unitTotal = (product.selling_price || 0) + addonsSubtotalPerUnit;
  const lineGrandTotal = unitTotal * quantity;

  const handleAddToCart = () => {
    if (!isValid) return;
    onConfirm(product, quantity, flattenedSelectedAddons);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] shadow-2xl rounded-3xl font-['Outfit',sans-serif]">
        <DialogHeader className="p-5 border-b border-[#F8C8DC]/60 dark:border-[#26262A] bg-[#FFF5F7]/80 dark:bg-[#1E1E21]/60 backdrop-blur-md">
          <div className="flex items-center gap-4">
            {product.image_url ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[#F8C8DC]/60 dark:border-[#26262A] bg-white dark:bg-[#121214]">
                <ImageWithFallback
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-extrabold uppercase tracking-tight text-[#3D2C2E] dark:text-white truncate">
                Customize {product.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  Base: {formatCurrency(product.selling_price)}
                </span>
                <span className="text-xs font-semibold text-[#7D6B6E] dark:text-zinc-400">• In Stock: {product.stock}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modifier Groups */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-[#7D6B6E] dark:text-zinc-500 text-xs font-bold uppercase">
              No add-ons available for this product.
            </div>
          ) : (
            groups.map((group) => {
              const error = groupValidationErrors[group.id];
              const groupSelections = selections[group.id] || {};

              return (
                <div key={group.id} className="space-y-3 pb-4 border-b border-[#F8C8DC]/40 dark:border-[#26262A] last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-white">
                          {group.name}
                        </h4>
                        {group.is_required && (
                          <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 uppercase tracking-widest">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-[#7D6B6E] dark:text-zinc-400 mt-0.5">
                        {group.selection_type === 'single'
                          ? 'Select 1 option'
                          : group.max_selections
                          ? `Choose up to ${group.max_selections} options (min: ${group.min_selections})`
                          : `Choose options (min: ${group.min_selections})`}
                      </p>
                    </div>

                    {error && (
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {error}
                      </span>
                    )}
                  </div>

                  {/* Addon choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.addons.map((addon) => {
                      const currentQty = groupSelections[addon.id] || 0;
                      const isSelected = currentQty > 0;

                      return (
                        <div
                          key={addon.id}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between select-none ${
                            isSelected
                              ? 'border-[#E75480] bg-[#FFF5F7] dark:bg-[#E75480]/15 text-[#3D2C2E] dark:text-white shadow-xs'
                              : 'border-[#F8C8DC]/60 dark:border-[#26262A] bg-white dark:bg-[#1E1E21] hover:border-[#E75480]/50 text-[#3D2C2E] dark:text-zinc-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (group.selection_type === 'single') {
                                handleSingleSelect(group.id, addon.id);
                              } else {
                                handleMultiToggle(group.id, addon, group);
                              }
                            }}
                            className="flex items-center gap-2.5 min-w-0 pr-2 flex-1 cursor-pointer"
                          >
                            <div
                              className={`size-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                group.selection_type === 'single' ? 'rounded-full' : 'rounded-lg'
                              } ${
                                isSelected
                                  ? 'bg-[#E75480] border-[#E75480] text-white shadow-xs'
                                  : 'border-[#7D6B6E]/30 bg-transparent'
                              }`}
                            >
                              {isSelected && <FiCheck className="size-3.5 stroke-3" />}
                            </div>
                            <span className="text-xs font-bold truncate">{addon.name}</span>
                          </button>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              {addon.price > 0 ? `+${formatCurrency(addon.price)}` : 'Free'}
                            </span>

                            {/* Quantity Stepper for Multi-Select Options */}
                            {isSelected && group.selection_type === 'multi' && (group.max_selections === null || group.max_selections > 1) && (
                              <div className="flex items-center bg-white dark:bg-[#121214] border border-[#F8C8DC]/60 dark:border-[#26262A] rounded-lg p-0.5 ml-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMultiQuantityChange(group.id, addon.id, -1, group);
                                  }}
                                  className="size-5 rounded flex items-center justify-center text-[#3D2C2E] dark:text-zinc-300 hover:bg-[#FFF5F7] dark:hover:bg-zinc-800"
                                >
                                  <FiMinus className="size-3" />
                                </button>
                                <span className="w-5 text-center text-[10px] font-black">{currentQty}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMultiQuantityChange(group.id, addon.id, 1, group);
                                  }}
                                  className="size-5 rounded flex items-center justify-center text-[#3D2C2E] dark:text-zinc-300 hover:bg-[#FFF5F7] dark:hover:bg-zinc-800"
                                >
                                  <FiPlus className="size-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Quantity Stepper & Add to Cart */}
        <DialogFooter className="p-4 border-t border-[#F8C8DC]/60 dark:border-[#26262A] bg-[#FFF5F7]/80 dark:bg-[#1E1E21]/80 flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <span className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Quantity:</span>
            <div className="flex items-center gap-2 border border-[#F8C8DC]/60 dark:border-[#26262A] rounded-xl bg-white dark:bg-[#121214] p-1 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-8 p-0 rounded-lg hover:bg-[#FFF5F7] dark:hover:bg-zinc-800"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
              >
                <FiMinus className="size-3.5" />
              </Button>
              <span className="w-8 text-center font-black text-sm text-[#3D2C2E] dark:text-white">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-8 p-0 rounded-lg hover:bg-[#FFF5F7] dark:hover:bg-zinc-800"
                onClick={() => setQuantity((prev) => Math.min(product.stock || 99, prev + 1))}
                disabled={quantity >= (product.stock || 99)}
              >
                <FiPlus className="size-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-[#F8C8DC]/60 dark:border-[#26262A] text-xs font-bold uppercase text-[#3D2C2E] dark:text-zinc-300 hover:bg-[#FFF5F7] dark:hover:bg-[#1E1E21]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!isValid}
              className="h-11 rounded-xl bg-[#E75480] hover:bg-[#E75480]/90 text-white font-extrabold text-xs uppercase shadow-md px-6 active:scale-95 transition-all"
            >
              Add to Order • {formatCurrency(lineGrandTotal)}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

