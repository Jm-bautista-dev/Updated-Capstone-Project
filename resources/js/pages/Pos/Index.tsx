import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface PosOrder {
  id: number;
  order_number: string;
  type: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method: string | null;
  paid_amount: number;
}

interface PosPageProps {
  orders: PosOrder[];
  auth?: any;
  errors?: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'POS', href: dashboard().url },
];

export default function PosIndex() {
  // ✅ Safe casting with unknown
  const { orders } = usePage().props as unknown as PosPageProps;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="POS" />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Point-of-Sale (POS)</h1>

        <p className="mb-4">
          Features:
          <ul className="list-disc ml-6">
            <li>Real-time order processing (dine-in, take-out, delivery)</li>
            <li>Cashier transaction handling and payment recording</li>
            <li>Automatic receipt generation</li>
            <li>Order status tracking (pending, preparing, completed)</li>
          </ul>
        </p>

        <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Order #</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Items</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Total</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-2">{order.order_number}</td>
                  <td className="px-4 py-2">{order.type}</td>
                  <td className="px-4 py-2">
                    {order.items.map((i, idx) => (
                      <div key={idx}>{i.name} x{i.quantity}</div>
                    ))}
                  </td>
                  <td className="px-4 py-2">${order.total.toFixed(2)}</td>
                  <td className="px-4 py-2">{order.status}</td>
                  <td className="px-4 py-2">
                    {order.paid_amount.toFixed(2)}{' '}
                    {order.payment_method && `(${order.payment_method})`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
