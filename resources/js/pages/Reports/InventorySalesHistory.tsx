import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React from 'react';
import { BreadcrumbItem } from '@/types';
import { FiClock, FiFileText } from 'react-icons/fi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory Sales History', href: '/inventory-sales-history' },
];

export default function InventorySalesHistory() {
  const { history } = usePage().props as any;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Sales History - Weight & Volume" />
      
      <div className="p-8 space-y-8 bg-background dark:bg-zinc-950 min-h-screen">
        <div className="flex items-center gap-4">
           <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <FiClock className="size-6" />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tight">Sales History</h1>
              <p className="text-sm font-medium text-muted-foreground italic">Comprehensive logs of weight and volume based deductions.</p>
           </div>
        </div>

        <Card className="border-none shadow-2xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden rounded-3xl bg-card dark:bg-zinc-900/50">
          <CardHeader className="bg-background dark:bg-zinc-900 border-b dark:border-zinc-800 px-8 py-6">
            <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground dark:text-white">
              <FiFileText className="text-primary dark:text-primary-foreground" /> Recent Deductions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-zinc-500 border-b border-muted dark:border-zinc-800 transition-colors">
                    <th className="px-8 py-4 text-left">Timestamp</th>
                    <th className="px-8 py-4 text-left">Item Name</th>
                    <th className="px-8 py-4 text-left">Quantity Sold</th>
                    <th className="px-8 py-4 text-left">Unit</th>
                    <th className="px-8 py-4 text-right">Value (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted/50">
                  {history.map((sale: any) => (
                    <tr key={sale.id} className="hover:bg-muted/30 dark:hover:bg-zinc-800/30 transition-colors group border-b dark:border-zinc-800 last:border-0 text-foreground dark:text-zinc-300">
                      <td className="px-8 py-4 font-medium text-muted-foreground dark:text-zinc-500">{sale.created_at}</td>
                      <td className="px-8 py-4 font-black tracking-tight text-slate-900 dark:text-zinc-200 group-hover:text-primary dark:group-hover:text-primary-foreground transition-colors">{sale.item_name}</td>
                      <td className="px-8 py-4 font-black text-slate-800 dark:text-zinc-300">{sale.quantity_sold.toLocaleString()}</td>
                      <td className="px-8 py-4">
                        <span className="bg-primary/5 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/10 uppercase">
                          {sale.unit_sold}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-right font-black text-emerald-600">
                        {sale.sale_price ? `₱${Number(sale.sale_price).toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center font-bold text-muted-foreground opacity-30 italic">
                         No sales records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
