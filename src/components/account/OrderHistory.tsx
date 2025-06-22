import * as React from 'react';
import { Timestamp } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button'; // Ensure Button is imported if used directly

// Type Definitions (re-declare or import from a shared types file if available)
interface AddressInfo {
  country?: string;
  city?: string;
  street?: string;
  full?: string;
  name?: string;
  address?: string;
}

interface OrderItemInfo {
  id?: string;
  productId?: string;
  name?: string;
  image?: string;
  quantity?: number;
  price?: number;
  total?: number;
}

interface OrderInfo {
  id: string;
  customerId?: string;
  date?: string | Timestamp;
  total?: number;
  status?: 'pending' | 'completed' | 'cancelled' | string;
  items?: OrderItemInfo[];
  shippingAddress?: AddressInfo;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: number;
  shipping?: number;
  discount?: number;
}

interface OrderHistoryProps {
  orderHistory: OrderInfo[];
  t: (key: string, options?: { defaultValue?: string | number }) => string;
  isRtl: boolean;
  formatCurrency: (amount: number | undefined | null, defaultValue?: string) => string;
  formatTimestamp: (timestamp: Timestamp | string | undefined | null) => string;
  setSelectedOrder: (order: OrderInfo | null) => void;
  setIsOrderDialogOpen: (isOpen: boolean) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({
  orderHistory,
  t,
  isRtl,
  formatCurrency,
  formatTimestamp,
  setSelectedOrder,
  setIsOrderDialogOpen,
}) => {
  return (
    <div className="p-6">
      <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} justify-between items-center mb-4`}>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground">{t('orderHistory')}</h3>
        <div className="text-sm text-gray-500 dark:text-gray-300">
          {t('totalOrders')}: <span className="font-semibold">{orderHistory.length || 0}</span>
        </div>
      </div>
      {orderHistory.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-muted-foreground bg-white dark:bg-muted rounded-lg">
            <thead className="bg-gray-50 dark:bg-muted/50">
              <tr>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('orderID')}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('date')}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('amount')}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t("account.orders.status")}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-muted divide-y divide-gray-200 dark:divide-muted-foreground">
              {orderHistory.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-muted-foreground/10">
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-foreground ${isRtl ? 'text-right' : 'text-left'}`}>{order.id}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 ${isRtl ? 'text-right' : 'text-left'}`}>{formatTimestamp(order.date)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 ${isRtl ? 'text-right' : 'text-left'}`}>{formatCurrency(order.total)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${order.status === 'completed' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                        order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300' :
                        order.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300' :
                        'bg-gray-100 dark:bg-muted-foreground/20 text-gray-800 dark:text-gray-200'}`}>
                      {order.status ? t(`orderStatus.${order.status}`, { defaultValue: order.status }) : 'N/A'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <Button
                      variant="link"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-0 h-auto"
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsOrderDialogOpen(true);
                      }}
                    >
                      {t('view')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 dark:bg-muted/50 rounded-lg" dir={isRtl ? 'rtl' : 'ltr'}>
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-foreground">{t('noOrders')}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{t('noOrdersYet')}</p>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;