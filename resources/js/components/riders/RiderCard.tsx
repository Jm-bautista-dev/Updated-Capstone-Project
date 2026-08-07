import { motion } from 'framer-motion';
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

interface RiderCardProps {
    rider: Rider;
    onEdit: (rider: Rider) => void;
    onDelete: (rider: Rider) => void;
    onSelectRider?: (rider: Rider) => void;
}

export function RiderCard({ rider, onEdit, onDelete, onSelectRider }: RiderCardProps) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
                if (onSelectRider) onSelectRider(rider);
                else onEdit(rider);
            }}
            className="group relative rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_10px_30px_-10px_rgba(231,84,128,0.05)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] p-5 backdrop-blur-2xl transition-all duration-300 hover:border-[#E75480]/40 dark:hover:border-white/20 cursor-pointer flex flex-col justify-between space-y-4"
        >
            {/* Header: Avatar, Name, Email & Menu */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl bg-linear-to-br from-[#FADADD]/60 via-[#F8C8DC]/30 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:via-rose-950/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] font-black text-base shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        {rider.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold text-[#3D2C2E] dark:text-[#F8FAFC] truncate group-hover:text-[#E75480] dark:group-hover:text-[#FF4F81] transition-colors">
                            {rider.name}
                        </h4>
                        <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] font-mono truncate mt-0.5">
                            {rider.email}
                        </p>
                    </div>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-xl text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] hover:bg-white/80 dark:hover:bg-white/10 cursor-pointer"
                            >
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] p-1.5 shadow-xl w-44 font-['Outfit']"
                        >
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B] px-3 py-1.5">
                                Options
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
                </div>
            </div>

            {/* Meta badges: Branch, Contact & Status */}
            <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#9E8B8E] dark:text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Branch</span>
                    <span className="font-bold text-[#3D2C2E] dark:text-[#E2E8F0] flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                        {rider.branch?.name || 'Unassigned'}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#9E8B8E] dark:text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Phone</span>
                    <span className="font-bold font-mono text-[#3D2C2E] dark:text-[#E2E8F0] flex items-center gap-1.5">
                        <Phone className="size-3.5 text-[#9E8B8E] dark:text-[#64748B]" />
                        {rider.phone || 'No phone'}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#9E8B8E] dark:text-[#64748B] font-bold uppercase text-[10px] tracking-wider">Deliveries</span>
                    <span className="font-bold font-mono text-[#E75480] dark:text-[#FF4F81] flex items-center gap-1.5">
                        <Bike className="size-3.5" />
                        {rider.deliveries_count || 0} completed
                    </span>
                </div>
            </div>

            {/* Footer: Status Badge & Account state */}
            <div className="pt-3 border-t border-[#F8C8DC]/30 dark:border-white/10 flex items-center justify-between gap-2">
                <RiderStatusBadge status={rider.status} />

                <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        rider.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                >
                    {rider.is_active ? 'Account Active' : 'Suspended'}
                </span>
            </div>
        </motion.div>
    );
}
