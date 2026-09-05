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
  id: number;
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
}

export interface SelectedModifier {
  addon_id: number;
  name: string;
  price: number;
  quantity: number;
  group_id?: number;
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
  const [selections, setSelections] = useState<Record<number, Record<number, number>>>({});
  const [prevProductKey, setPrevProductKey] = useState<string | null>(null);

  const currentProductKey = isOpen && product ? `${product.id}` : null;
  if (currentProductKey !== prevProductKey) {
    setPrevProductKey(currentProductKey);
    setQuantity(1);
    const initial: Record<number, Record<number, number>> = {};
    (product?.addon_groups || []).forEach((group) => {
      initial[group.id] = {};
    });
    setSelections(initial);
  }

  const groups = useMemo(() => product?.addon_groups || [], [product]);

  // Toggle or adjust selection for single vs multi groups
  const handleSingleSelect = (groupId: number, addonId: number) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: { [addonId]: 1 },
    }));
  };

  const handleMultiToggle = (groupId: number, addon: ModifierAddon, group: ModifierGroup) => {
    setSelections((prev) => {
      const groupSelections = { ...(prev[groupId] || {}) };
      const currentQty = groupSelections[addon.id] || 0;

      if (currentQty > 0) {
        delete groupSelections[addon.id];
      } else {
        const totalSelectedInGroup = Object.values(groupSelections).reduce((a, b) => a + b, 0);
        if (group.max_selections !== null && totalSelectedInGroup >= group.max_selections) {
          // If max reached in multi-select, replace if max is 1 or block
          if (group.max_selections === 1) {
            return {
              ...prev,
              [groupId]: { [addon.id]: 1 },
            };
          }
          return prev; // Block selecting more than max
        }
        groupSelections[addon.id] = 1;
      }

      return {
        ...prev,
        [groupId]: groupSelections,
      };
    });
  };

  // Validation checks per group
  const groupValidationErrors = useMemo(() => {
    const errors: Record<number, string> = {};

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
    return flattenedSelectedAddons.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        <DialogHeader className="p-5 border-b border-border bg-muted/40">
          <div className="flex items-center gap-4">
            {product.image_url ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border bg-background">
                <ImageWithFallback
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                Customize {product.name}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                  Base: {formatCurrency(product.selling_price)}
                </span>
                <span className="text-xs text-muted-foreground">• In Stock: {product.stock}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Modifier Groups */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No options available for this product.
            </div>
          ) : (
            groups.map((group) => {
              const error = groupValidationErrors[group.id];
              const groupSelections = selections[group.id] || {};

              return (
                <div key={group.id} className="space-y-3 pb-4 border-b border-border/60 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">
                          {group.name}
                        </h4>
                        {group.is_required && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.selection_type === 'single'
                          ? 'Select 1 option'
                          : group.max_selections
                          ? `Choose up to ${group.max_selections} options (min: ${group.min_selections})`
                          : `Choose options (min: ${group.min_selections})`}
                      </p>
                    </div>

                    {error && (
                      <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {error}
                      </span>
                    )}
                  </div>

                  {/* Addon choices */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {group.addons.map((addon) => {
                      const isSelected = (groupSelections[addon.id] || 0) > 0;

                      return (
                        <button
                          key={addon.id}
                          type="button"
                          onClick={() => {
                            if (group.selection_type === 'single') {
                              handleSingleSelect(group.id, addon.id);
                            } else {
                              handleMultiToggle(group.id, addon, group);
                            }
                          }}
                          className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer select-none ${
                            isSelected
                              ? 'border-rose-500 bg-rose-500/5 dark:bg-rose-500/10 text-foreground ring-1 ring-rose-500/40'
                              : 'border-border bg-card hover:bg-muted/50 text-foreground/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors ${
                                group.selection_type === 'single' ? 'rounded-full' : 'rounded-md'
                              } ${
                                isSelected
                                  ? 'bg-rose-600 border-rose-600 text-white'
                                  : 'border-muted-foreground/30 bg-background'
                              }`}
                            >
                              {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-3" />}
                            </div>
                            <span className="text-sm font-medium truncate">{addon.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground shrink-0">
                            {addon.price > 0 ? `+${formatCurrency(addon.price)}` : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Quantity Stepper & Add to Cart */}
        <DialogFooter className="p-4 border-t border-border bg-muted/30 flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <span className="text-xs font-semibold text-muted-foreground">Quantity:</span>
            <div className="flex items-center gap-2 border border-border rounded-lg bg-background p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
              >
                <FiMinus className="w-3.5 h-3.5" />
              </Button>
              <span className="w-8 text-center font-bold text-sm text-foreground">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded"
                onClick={() => setQuantity((prev) => Math.min(product.stock || 99, prev + 1))}
                disabled={quantity >= (product.stock || 99)}
              >
                <FiPlus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={!isValid}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md px-5"
            >
              Add to Cart • {formatCurrency(lineGrandTotal)}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
