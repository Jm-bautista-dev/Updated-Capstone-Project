import { AnimatePresence } from 'framer-motion';
import { PackageSearch } from 'lucide-react';

import { InventoryCard } from '@/components/inventory/InventoryCard';
import type { InventoryRow } from '@/components/inventory/InventoryHero';

interface InventoryGridProps {
    inventory: InventoryRow[];
    isAdmin: boolean;
    onSelectRow: (row: InventoryRow) => void;
    onOpenStockIn: (row: InventoryRow) => void;
    onOpenWastage: (row: InventoryRow) => void;
    onOpenEdit: (row: InventoryRow) => void;
    onOpenDelete: (row: InventoryRow) => void;
}

export function InventoryGrid({
    inventory,
    isAdmin,
    onSelectRow,
    onOpenStockIn,
    onOpenWastage,
    onOpenEdit,
    onOpenDelete,
}: InventoryGridProps) {
    if (inventory.length === 0) {
        return (
            <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-12 text-center backdrop-blur-2xl transition-colors duration-300">
                <div className="flex flex-col items-center justify-center gap-2">
                    <PackageSearch className="size-10 text-[#E75480]/50 dark:text-[#FF4F81]/50 mb-1" />
                    <span className="font-extrabold text-base text-[#3D2C2E] dark:text-[#F8FAFC]">No Inventory Rows Match Criteria</span>
                    <span className="text-xs font-medium text-[#9E8B8E] dark:text-[#64748B]">Try adjusting your search query, status chips, or branch filter.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
                {inventory.map((row, idx) => (
                    <InventoryCard
                        key={`${row.id}-${row.branch_id}`}
                        row={row}
                        isAdmin={isAdmin}
                        onSelectRow={onSelectRow}
                        onOpenStockIn={onOpenStockIn}
                        onOpenWastage={onOpenWastage}
                        onOpenEdit={onOpenEdit}
                        onOpenDelete={onOpenDelete}
                        index={idx}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
