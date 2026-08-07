import { User } from 'lucide-react';
import React from 'react';
import { EmployeeCard, type Employee } from '@/components/employees/EmployeeCard';

interface EmployeeGridProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    onDelete: (id: number) => void;
    onSelectEmployee?: (employee: Employee) => void;
}

export function EmployeeGrid({ employees, onEdit, onDelete, onSelectEmployee }: EmployeeGridProps) {
    if (employees.length === 0) {
        return (
            <div className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-12 text-center shadow-xs backdrop-blur-2xl">
                <div className="size-16 rounded-full bg-[#FADADD]/30 dark:bg-[#E1062C]/10 text-[#E75480] dark:text-[#FF4F81] flex items-center justify-center mx-auto mb-4">
                    <User className="size-8 opacity-40" />
                </div>
                <h3 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">No Members Found</h3>
                <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] max-w-sm mx-auto mt-1 font-medium">
                    No staff records match your search criteria or role filters.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((employee) => (
                <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSelectEmployee={onSelectEmployee}
                />
            ))}
        </div>
    );
}
