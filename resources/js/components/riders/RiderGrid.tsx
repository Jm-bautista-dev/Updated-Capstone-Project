import { Bike } from 'lucide-react';
import React from 'react';
import { RiderCard, type Rider } from '@/components/riders/RiderCard';

interface RiderGridProps {
    riders: Rider[];
    onEdit: (rider: Rider) => void;
    onDelete: (rider: Rider) => void;
    onSelectRider?: (rider: Rider) => void;
}

export function RiderGrid({ riders, onEdit, onDelete, onSelectRider }: RiderGridProps) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {riders.map((rider) => (
                <RiderCard
                    key={rider.id}
                    rider={rider}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSelectRider={onSelectRider}
                />
            ))}
        </div>
    );
}
