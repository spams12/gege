import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Timestamp } from 'firebase/firestore';

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

interface OrderDetailsDialogProps {
  selectedOrder: OrderInfo;
  isRtl: boolean;
  formatTimestamp: (timestamp: Timestamp | string | undefined | null) => string;
  formatCurrency: (amount: number | undefined | null, defaultValue?: string) => string;
  setIsOrderDialogOpen: (isOpen: boolean) => void;
  t: (key: string, options?: { [key: string]: unknown }) => string;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({
  selectedOrder,
  isRtl,
  formatTimestamp,
  formatCurrency,
  setIsOrderDialogOpen,
  t,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 animate-fadeIn border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-y-auto">
        <button
          className={`absolute top-4 ${isRtl ? 'left-4' : 'right-4'} text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-2xl`}
          onClick={() => setIsOrderDialogOpen(false)}
          aria-label={t('common.close')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold mb-6 text-blue-700 dark:text-blue-300 flex items-center gap-2">
          {t('userInfoStep.orderDetails')}
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('orderID')}</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.id}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('date')}</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{formatTimestamp(selectedOrder.date)}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('status')}</div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                ${selectedOrder.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                  selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'}`}>
                {selectedOrder.status ? t(`orderStatus.${selectedOrder.status}`, { defaultValue: selectedOrder.status }) : 'N/A'}
              </span>
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('cartPage.paymentMethod')}</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.paymentMethod || 'N/A'}</div>
            </div>
          </div>

          {selectedOrder.shippingAddress && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
              <div className="font-semibold text-blue-600 dark:text-blue-300 mb-2">{t('userInfoStep.address')}</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-200">{selectedOrder.shippingAddress.name || ''}</div>
              <div className="text-sm text-zinc-700 dark:text-zinc-200">
                {selectedOrder.shippingAddress.address || `${selectedOrder.shippingAddress.street || ''}, ${selectedOrder.shippingAddress.city || ''}, ${selectedOrder.shippingAddress.country || ''}`.replace(/^, |, $/g, '') || 'N/A'}
              </div>
            </div>
          )}

          {selectedOrder.items && selectedOrder.items.length > 0 && (
            <div>
              <div className="font-semibold text-blue-600 dark:text-blue-300 mb-2">{t('userInfoStep.product', { count: selectedOrder.items.length })}</div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-700 border-t border-b dark:border-zinc-700">
                {selectedOrder.items.map((item, idx) => (
                  <div key={item.id || item.productId || idx} className="flex items-center py-3 gap-4">
                    <img src={item.image || '/placeholder-image.png'} alt={item.name || 'Product Image'} className="w-16 h-16 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700" />
                    <div className="flex-1">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{item.name || 'N/A'}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('productId')}: {item.productId || 'N/A'}</div>
                    </div>
                    <div className={`${isRtl ? 'text-left' : 'text-right'}`}>
                      <div className="text-zinc-900 dark:text-zinc-100 font-semibold">{item.quantity || 0} × {formatCurrency(item.price, '0')}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">= {formatCurrency(item.total, '0')}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('userInfoStep.fullName')}</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.customerName || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('account.profile.emailLabel')}</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">{selectedOrder.customerEmail || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{t('userInfoStep.phone')}</div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100" dir="ltr">{selectedOrder.customerPhone || 'N/A'}</div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 mt-6">
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4 w-full md:min-w-[280px] md:w-auto">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500 dark:text-zinc-400">{t('cartPage.subtotal')}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-zinc-500 dark:text-zinc-400">{t('cartPage.shipping')}</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(selectedOrder.shipping)}</span>
              </div>
              {selectedOrder.discount !== undefined && selectedOrder.discount !== null && selectedOrder.discount !== 0 && (
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-500 dark:text-zinc-400">{t('account.discount')}</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{formatCurrency(selectedOrder.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base mt-2 border-t dark:border-zinc-700 pt-2 font-bold">
                <span className="text-blue-700 dark:text-blue-300">{t('amount')}</span>
                <span className="text-blue-700 dark:text-blue-300">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsDialog;