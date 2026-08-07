import { Bike, Building2, Edit2, MoreHorizontal, Phone, Trash2, User } from 'lucide-react';
import React from 'react';
import { RiderStatusBadge } from '@/components/riders/RiderStatusBadge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Rider {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: 'available' | 'busy' | 'offline' | string;
    is_active: boolean;
    branch_id: number;
    branch?: { id: number; name: string };
    deliveries_count?: number;
}

interface RiderTableProps {
    riders: Rider[];
    onEdit: (rider: Rider) => void;
    onDelete: (rider: Rider) => void;
    onSelectRider?: (rider: Rider) => void;
}

export function RiderTable({ riders, onEdit, onDelete, onSelectRider }: RiderTableProps) {
    if (riders.length === 0) {
        return (
            <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-12 text-center shadow-xs backdrop-blur-2xl">
                <div className="size-16 rounded-full bg-[#FADADD]/30 dark:bg-[#E1062C]/10 text-[#E75480] dark:text-[#FF4F81] flex items-center justify-center mx-auto mb-4">
                    <Bike className="size-8" />
                </div>
                <h3 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">No Riders Found</h3>
                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] max-w-sm mx-auto mt-1 font-medium">
                    No rider records match your search criteria or branch filters.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl transition-colors duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#F8C8DC]/40 dark:border-white/10 bg-[#FFF9FA]/60 dark:bg-[#181820]/60 text-[11px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">
                            <th className="py-4 px-6">Rider Info</th>
                            <th className="py-4 px-6">Branch Assignment</th>
                            <th className="py-4 px-6">Contact Number</th>
                            <th className="py-4 px-6 text-center">Deliveries</th>
                            <th className="py-4 px-6">Status</th>
                            <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                        {riders.map((rider) => (
                            <tr
                                key={rider.id}
                                onClick={() => {
                                    if (onSelectRider) onSelectRider(rider);
                                    else onEdit(rider);
                                }}
                                className="group hover:bg-[#FFF5F7]/70 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer"
                            >
                                {/* Rider Info */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3.5">
                                        <div className="size-11 rounded-2xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] font-black text-sm shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                                            {rider.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC] group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                                                {rider.name}
                                            </h4>
                                            <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] font-mono mt-0.5">
                                                {rider.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Branch */}
                                <td className="py-4 px-6">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-[#181820]/70 border border-[#F8C8DC]/40 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0]">
                                        <Building2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                        <span>{rider.branch?.name || 'Unassigned'}</span>
                                    </div>
                                </td>

                                {/* Contact */}
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2 text-xs font-medium font-mono text-[#3D2C2E] dark:text-[#E2E8F0]">
                                        <Phone className="size-3.5 text-[#9E8B8E] dark:text-[#64748B]" />
                                        <span>{rider.phone || 'No phone'}</span>
                                    </div>
                                </td>

                                {/* Deliveries Count */}
                                <td className="py-4 px-6 text-center">
                                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-[#FADADD]/30 dark:bg-white/5 text-[#E75480] dark:text-[#FF4F81] font-mono font-black text-sm">
                                        {rider.deliveries_count || 0}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-6">
                                    <RiderStatusBadge status={rider.status} />
                                </td>

                                {/* Actions Menu */}
                                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-9 rounded-xl text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer"
                                            >
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="end"
                                            className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] p-1.5 shadow-xl w-44 font-['Outfit']"
                                        >
                                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] px-3 py-1.5">
                                                Rider Options
                                            </DropdownMenuLabel>
                                            {onSelectRider && (
                                                <DropdownMenuItem
                                                    onClick={() => onSelectRider(rider)}
                                                    className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer dark:focus:bg-white/10"
                                                >
                                                    <User className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                                                    <span>View Profile</span>
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                onClick={() => onEdit(rider)}
                                                className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer dark:focus:bg-white/10"
                                            >
                                                <Edit2 className="size-3.5 text-blue-500" />
                                                <span>Edit Information</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-[#F8C8DC]/40 dark:bg-white/10 my-1" />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(rider)}
                                                className="rounded-xl px-3 py-2 text-xs font-bold gap-2 cursor-pointer text-rose-600 dark:text-rose-400 dark:focus:bg-rose-950/30"
                                            >
                                                <Trash2 className="size-3.5" />
                                                <span>Remove Rider</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
