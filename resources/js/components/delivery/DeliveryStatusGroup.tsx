import { ChevronDown } from 'lucide-react';
import React, { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import DeliveryCard from './DeliveryCard';
import DeliveryTable from './DeliveryTable';
import { STATUS_GROUPS } from './types';
import type { Delivery, ViewMode } from './types';

interface DeliveryStatusGroupProps {
    deliveries: Delivery[];
    viewMode: ViewMode;
    collapsedGroups: Set<string>;
    onToggleGroup: (key: string) => void;
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
}

const StatusGroupSection = React.memo(function StatusGroupSection({
    label,
    color,
    bg,
    border,
    ring,
    deliveries,
    isOpen,
    viewMode,
    onToggle,
    onSelect,
    onUpdateStatus,
    onAssignRider,
}: {
    label: string;
    color: string;
    bg: string;
    border: string;
    ring: string;
    deliveries: Delivery[];
    isOpen: boolean;
    viewMode: ViewMode;
    onToggle: () => void;
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
}) {
    if (deliveries.length === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <button
                    className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl ${bg} ${border} border hover:opacity-90 transition-all duration-200 group/trigger font-['Outfit'] backdrop-blur-xl`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`size-2.5 rounded-full ${color.replace('text-', 'bg-')} ${ring} ring-4`} />
                        <span className={`text-sm font-black ${color}`}>{label}</span>
                        <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2 py-0 bg-white/80 dark:bg-[#1C1C28] border border-[#F8C8DC]/40 dark:border-white/10">
                            {deliveries.length}
                        </Badge>
                    </div>
                    <ChevronDown
                        className={`size-4 ${color} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
                {viewMode === 'table' ? (
                    <DeliveryTable
                        deliveries={deliveries}
                        onSelect={onSelect}
                        onUpdateStatus={onUpdateStatus}
                        onAssignRider={onAssignRider}
                        containerHeight={Math.min(400, deliveries.length * 56)}
                    />
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {deliveries.map(delivery => (
                            <DeliveryCard
                                key={delivery.id}
                                delivery={delivery}
                                onSelect={onSelect}
                                onUpdateStatus={onUpdateStatus}
                                onAssignRider={onAssignRider}
                            />
                        ))}
                    </div>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
});

const DeliveryStatusGroup = React.memo(function DeliveryStatusGroup({
    deliveries,
    viewMode,
    collapsedGroups,
    onToggleGroup,
    onSelect,
    onUpdateStatus,
    onAssignRider,
}: DeliveryStatusGroupProps) {
    const grouped = useMemo(() => {
        const map = new Map<string, Delivery[]>();
        STATUS_GROUPS.forEach(g => map.set(g.key, []));

        deliveries.forEach(delivery => {
            const group = STATUS_GROUPS.find(g => (g.statuses as readonly string[]).includes(delivery.status));
            if (group) {
                map.get(group.key)!.push(delivery);
            } else {
                // Fallback: put unrecognized statuses in pending
                map.get('pending')!.push(delivery);
            }
        });

        return map;
    }, [deliveries]);

    return (
        <div className="space-y-4">
            {STATUS_GROUPS.map(group => {
                const groupDeliveries = grouped.get(group.key) || [];
                return (
                    <StatusGroupSection
                        key={group.key}
                        label={group.label}
                        color={group.color}
                        bg={group.bg}
                        border={group.border}
                        ring={group.ring}
                        deliveries={groupDeliveries}
                        isOpen={!collapsedGroups.has(group.key)}
                        viewMode={viewMode}
                        onToggle={() => onToggleGroup(group.key)}
                        onSelect={onSelect}
                        onUpdateStatus={onUpdateStatus}
                        onAssignRider={onAssignRider}
                    />
                );
            })}
        </div>
    );
});

export default DeliveryStatusGroup;
