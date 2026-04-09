import React, { useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import type { Delivery, ViewMode } from './types';
import { STATUS_GROUPS } from './types';
import DeliveryCard from './DeliveryCard';
import DeliveryTable from './DeliveryTable';

interface DeliveryStatusGroupProps {
    deliveries: Delivery[];
    viewMode: ViewMode;
    collapsedGroups: Set<string>;
    onToggleGroup: (key: string) => void;
    onSelect: (delivery: Delivery) => void;
    onUpdateStatus: (id: number) => void;
}

const StatusGroupSection = React.memo(function StatusGroupSection({
    groupKey,
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
}: {
    groupKey: string;
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
}) {
    if (deliveries.length === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
                <button
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${bg} ${border} border hover:opacity-90 transition-all duration-200 group/trigger`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`size-2.5 rounded-full ${color.replace('text-', 'bg-')} ${ring} ring-4`} />
                        <span className={`text-sm font-black ${color}`}>{label}</span>
                        <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2 py-0">
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
                        groupKey={group.key}
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
                    />
                );
            })}
        </div>
    );
});

export default DeliveryStatusGroup;
