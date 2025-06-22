import * as React from 'react';
import { Timestamp } from 'firebase/firestore';

interface AddressInfo {
  country?: string;
  city?: string;
  street?: string;
  full?: string;
  name?: string;
  address?: string;
}

interface CustomerProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  joinDate?: string | Timestamp;
  address?: AddressInfo;
  totalSpent?: number;
  totalOrders?: number;
  lastOrder?: string | Timestamp;
}

interface CustomerStatisticsProps {
  customer: CustomerProfile;
  t: (key: string, options?: { defaultValue?: string | number }) => string;
  isRtl: boolean;
  formatCurrency: (amount: number | undefined | null, defaultValue?: string) => string;
  formatTimestamp: (timestamp: Timestamp | string | undefined | null) => string;
}

const CustomerStatistics: React.FC<CustomerStatisticsProps> = ({
  customer,
  t,
  isRtl,
  formatCurrency,
  formatTimestamp,
}) => {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-foreground mb-6">{t('customerStatistics')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-muted/50 p-6 rounded-lg shadow border border-gray-100 dark:border-muted-foreground/20">
          <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('totalSpent')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground" dir="ltr">{formatCurrency(customer.totalSpent)}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <svg className="w-6 h-6 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-muted/50 p-6 rounded-lg shadow border border-gray-100 dark:border-muted-foreground/20">
          <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('totalOrders')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">{customer.totalOrders || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-muted/50 p-6 rounded-lg shadow border border-gray-100 dark:border-muted-foreground/20">
          <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-300">{t('lastOrderDate')}</p>
              <p className="text-lg font-medium text-gray-900 dark:text-foreground" dir="ltr">{formatTimestamp(customer.lastOrder)}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg className="w-6 h-6 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerStatistics;