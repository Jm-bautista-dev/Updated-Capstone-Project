import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Edit2, Trash2, Eye, MoreHorizontal, PackageSearch } from 'lucide-react';

import type { Category } from '@/components/categories/CategoriesHero';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface CategoryTableProps {
    categories: Category[];
    isAdmin: boolean;
    density: 'compact' | 'comfortable';
    selectedIds: number[];
    onToggleSelectAll: (checked: boolean) => void;
    onToggleSelectRow: (id: number) => void;
    onSelectCategory: (category: Category) => void;
    onOpenEdit: (category: Category) => void;
    onOpenDelete: (category: Category) => void;
}

export function CategoryTable({
    categories,
    isAdmin,
    density,
    selectedIds,
    onToggleSelectAll,
    onToggleSelectRow,
    onSelectCategory,
    onOpenEdit,
    onOpenDelete,
}: CategoryTableProps) {
    const isAllSelected = categories.length > 0 && categories.every((c) => selectedIds.includes(c.id));

    return (
        <div className="rounded-[2.5rem] bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 overflow-hidden flex flex-col min-h-0">
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-[#FFFDFE]/90 dark:bg-[#14141E]/90 border-b border-[#F8C8DC]/40 dark:border-white/10 backdrop-blur-md">
                        <tr className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                            <th className="py-4 px-6 w-10">
                                {isAdmin && (
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={(e) => onToggleSelectAll(e.target.checked)}
                                        className="size-4 rounded border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#E1062C] focus:ring-[#E75480]/20 cursor-pointer"
                                    />
                                )}
                            </th>
                            <th className="py-4 px-6">Category Details</th>
                            <th className="py-4 px-6 text-center">Assigned Products</th>
                            <th className="py-4 px-6 hidden sm:table-cell">Created Date</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/20 dark:divide-white/5">
                        <AnimatePresence mode="popLayout">
                            {categories.length === 0 ? (
                                <motion.tr
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-48 text-center"
                                >
                                    <td colSpan={5} className="p-8 text-[#7D6B6E] dark:text-[#94A3B8]">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <PackageSearch className="size-8 text-[#E75480]/50 dark:text-[#FF4F81]/50 mb-1" />
                                            <span className="font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">No Categories Found</span>
                                            <span className="text-xs text-[#9E8B8E] dark:text-[#64748B]">Try adjusting your search query or add a new category.</span>
                                        </div>
                                    </td>
                                </motion.tr>
                            ) : (
                                categories.map((category) => (
                                    <motion.tr
                                        key={category.id}
                                        layout
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        className="hover:bg-[#FADADD]/15 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => onSelectCategory(category)}
                                    >
                                        {/* Checkbox */}
                                        <td className="p-4 px-6 align-middle" onClick={(e) => e.stopPropagation()}>
                                            {isAdmin && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(category.id)}
                                                    onChange={() => onToggleSelectRow(category.id)}
                                                    className="size-4 rounded border-[#F8C8DC] dark:border-white/10 text-[#E75480] dark:text-[#E1062C] focus:ring-[#E75480]/20 cursor-pointer"
                                                />
                                            )}
                                        </td>

                                        {/* Category details with image thumbnail */}
                                        <td className={cn('px-6 align-middle', density === 'compact' ? 'py-2.5' : 'py-4')}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="size-11 rounded-xl bg-linear-to-br from-[#FFF5F7] to-[#FADADD]/40 dark:from-[#1A1A24] dark:to-[#222230] border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                                                    {category.image_url ? (
                                                        <img
                                                            src={category.image_url}
                                                            alt={category.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Layers className="size-5 text-[#E75480]/50 dark:text-[#FF4F81]/50" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors leading-snug">
                                                        {category.name}
                                                    </span>
                                                    {category.description && (
                                                        <span className="text-[11px] font-medium text-[#9E8B8E] dark:text-[#64748B] line-clamp-1 max-w-xs">
                                                            {category.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Assigned Products Count */}
                                        <td className="p-4 px-6 align-middle text-center">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black font-mono bg-[#FADADD]/30 dark:bg-white/5 border border-[#F8C8DC]/50 dark:border-white/10 text-[#E75480] dark:text-[#FF4F81]">
                                                {category.products_count || 0} items
                                            </span>
                                        </td>

                                        {/* Created Date */}
                                        <td className="p-4 px-6 align-middle hidden sm:table-cell text-[#7D6B6E] dark:text-[#94A3B8] font-medium">
                                            {category.created_at ? format(new Date(category.created_at), 'MMM d, yyyy') : 'N/A'}
                                        </td>

                                        {/* Actions Dropdown & Quick Buttons */}
                                        <td className="p-4 px-6 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => onSelectCategory(category)}
                                                    className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] hover:text-[#E75480] dark:hover:text-[#FF4F81] cursor-pointer"
                                                    title="View Specifications"
                                                >
                                                    <Eye className="size-4" />
                                                </Button>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="size-8 rounded-xl hover:bg-[#FFF5F7] dark:hover:bg-white/10 text-[#5D4A4D] dark:text-[#E2E8F0] cursor-pointer"
                                                        >
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] p-1.5 shadow-xl w-44 font-['Outfit']">
                                                        <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] px-3 py-1.5">
                                                            Options
                                                        </DropdownMenuLabel>
                                                        <DropdownMenuItem
                                                            onClick={() => onOpenEdit(category)}
                                                            className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer dark:focus:bg-white/10"
                                                        >
                                                            <Edit2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                                            <span>Edit Category</span>
                                                        </DropdownMenuItem>
                                                        {isAdmin && (
                                                            <>
                                                                <DropdownMenuSeparator className="bg-[#F8C8DC]/40 dark:bg-white/10 my-1" />
                                                                <DropdownMenuItem
                                                                    onClick={() => onOpenDelete(category)}
                                                                    className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer text-rose-600 dark:text-rose-400 dark:focus:bg-rose-950/30"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    <span>Delete Category</span>
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </AnimatePresence>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
