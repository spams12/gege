import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router'; // Import useRouter
import dynamic from 'next/dynamic'; // Import dynamic
import { AuthContext } from '@/contexts/AuthContext';
import { withAuth } from '@/utils/auth'; // Import the HOC
import {
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { dbAdmin, admin } from '@/lib/firebaseAdmin';
const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
const Alert = dynamic(() => import('@/components/ui/alert').then(mod => mod.Alert), { ssr: false });
const AlertDescription = dynamic(() => import('@/components/ui/alert').then(mod => mod.AlertDescription), { ssr: false });
const AlertTitle = dynamic(() => import('@/components/ui/alert').then(mod => mod.AlertTitle), { ssr: false });

// Dynamically import OrderDetailsDialog and new account components
const DynamicOrderDetailsDialog = dynamic(() => import('@/components/OrderDetailsDialog'), { ssr: false });
const DynamicPersonalInformation = dynamic(() => import('@/components/account/PersonalInformation'), { ssr: false });
const DynamicOrderHistory = dynamic(() => import('@/components/account/OrderHistory'), { ssr: false });
const DynamicCustomerStatistics = dynamic(() => import('@/components/account/CustomerStatistics'), { ssr: false });

// --- Type Definitions ---
interface AddressInfo {
  country?: string;
  city?: string;
  street?: string;
  full?: string;
  name?: string; // For shipping address in order
  address?: string; // For shipping address in order (can be full address line)
}

interface CustomerProfile {
  id: string; // Assuming customerId is part of the profile
  name?: string;
  email?: string;
  phone?: string;
  joinDate?: string | Timestamp; // Store as ISO string after fetching
  address?: AddressInfo;
  totalSpent?: number;
  totalOrders?: number;
  lastOrder?: string | Timestamp; // Store as ISO string after fetching
}

interface OrderItemInfo {
  id?: string | null;
  productId?: string | null;
  name?: string | null;
  image?: string | null;
  quantity?: number | null;
  price?: number | null;
  total?: number | null;
}

interface OrderInfo {
  id: string;
  customerId?: string;
  date?: string | Timestamp; // Store as ISO string after fetching
  total?: number;
  status?: 'pending' | 'completed' | 'cancelled' | string; // Allow other statuses
  items?: OrderItemInfo[];
  shippingAddress?: AddressInfo | null;
  paymentMethod?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal?: number;
  shipping?: number;
  discount?: number;
}

interface AccountPageProps {
  user?: { uid: string; email?: string | null; displayName?: string | null } | null; // from withAuth, or null if auth fails & no redirect
  customerData?: CustomerProfile | null;      // Optional: might not be present if auth fails
  ordersData?: OrderInfo[];                 // Optional: might not be present if auth fails
  error?: string;                             // To pass errors from getServerSideProps or withAuth
}

const AccountPage = ({ customerData: initialCustomerData, ordersData: initialOrdersData, error: serverError, user }: AccountPageProps) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { currentUser } = useContext(AuthContext); // Still useful for client-side checks or UI elements

  const [customer, setCustomer] = useState<CustomerProfile | null>(initialCustomerData || null);
  const [editedCustomer, setEditedCustomer] = useState<CustomerProfile | null>(initialCustomerData || null);
  const [orderHistory, setOrderHistory] = useState<OrderInfo[]>(initialOrdersData || []);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderInfo | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validTabs = ['info', 'orders', 'stats'];
  const urlTab = router.query.tab as string;
  const initialTab = validTabs.includes(urlTab) ? urlTab : 'info';
  const [activeTab, setActiveTabState] = useState(initialTab);

  // Use customerId from AuthContext for client-side operations if available,
  // otherwise, rely on the ID from server-fetched customerData.
  // The `user` prop from `withAuth` is now the primary source of truth for the authenticated user's ID.
  const customerId = user?.uid || initialCustomerData?.id;

  useEffect(() => {
    const currentUrlTab = router.query.tab as string;
    if (currentUrlTab && validTabs.includes(currentUrlTab) && currentUrlTab !== activeTab) {
      setActiveTabState(currentUrlTab);
    } else if (!currentUrlTab && activeTab !== 'info') {
      setActiveTabState('info');
    }
  }, [router.query.tab, activeTab]);

  useEffect(() => {
    setCustomer(initialCustomerData);
    setEditedCustomer(initialCustomerData);
    setOrderHistory(initialOrdersData);
    if (serverError) {
      setFeedbackMessage({ type: 'error', message: serverError });
    }
  }, [initialCustomerData, initialOrdersData, serverError]);

  const handleTabChange = (tab: string) => {
    setActiveTabState(tab);
    setFeedbackMessage(null); // Clear feedback messages on tab change
    const newQuery = { ...router.query };
    if (tab === 'info') {
      delete newQuery.tab;
    } else {
      newQuery.tab = tab;
    }
    router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedCustomer(customer); // Reset changes if canceling
      setFeedbackMessage(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (
    field: keyof CustomerProfile | `address.${keyof AddressInfo}`,
    value: string | number | boolean | undefined // Allow undefined for cases like clearing an optional field
  ) => {
    setEditedCustomer(prev => {
      if (!prev) return null;
      // Create a shallow copy to avoid direct state mutation
      const updatedCustomer = { ...prev };

      if (field.startsWith('address.')) {
        const childKey = field.substring('address.'.length) as keyof AddressInfo;
        // Ensure address object exists
        const currentAddress = updatedCustomer.address || {};
        updatedCustomer.address = {
          ...currentAddress,
          [childKey]: value === undefined ? undefined : String(value) // Ensure value is string or undefined for address fields
        };
      } else {
        const profileKey = field as keyof CustomerProfile;
        // More type-safe assignment for CustomerProfile fields
        if (profileKey === 'name' || profileKey === 'email' || profileKey === 'phone') {
          updatedCustomer[profileKey] = value === undefined ? undefined : String(value);
        } else if (profileKey === 'totalSpent' || profileKey === 'totalOrders') {
          updatedCustomer[profileKey] = value === undefined ? undefined : Number(value);
        }
        // Note: 'id', 'joinDate', 'lastOrder', 'address' are not typically edited this way directly.
        // 'address' is handled by the 'address.' prefix.
        // 'id' should not be changed. 'joinDate' and 'lastOrder' are usually system-set.
      }
      return updatedCustomer;
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSaveChanges = async () => {
    if (!customerId) {
      setFeedbackMessage({ type: 'error', message: t('errors.noCustomerId') });
      return;
    }
    if (!editedCustomer) {
      setFeedbackMessage({ type: 'error', message: t('errors.noDataToSave') });
      return;
    }

    // Basic Validation
    if (editedCustomer.email && !validateEmail(editedCustomer.email)) {
      setFeedbackMessage({ type: 'error', message: t('errors.invalidEmail') });
      return;
    }
    // Add more validation as needed (e.g., for phone, required fields)

    setFeedbackMessage(null); // Clear previous messages
    try {
      const customerDocRef = doc(db, "customers", customerId);
      // Prepare data for Firestore, removing undefined fields or converting types if necessary
      const dataToUpdate: Partial<CustomerProfile> = { ...editedCustomer };
      delete dataToUpdate.id; // Don't try to update the ID itself

      // Ensure address is an object, even if empty, to avoid issues with Firestore
      if (dataToUpdate.address === undefined) {
          dataToUpdate.address = {};
      }

      await updateDoc(customerDocRef, dataToUpdate);
      setCustomer(editedCustomer);
      setIsEditing(false);
      setFeedbackMessage({ type: 'success', message: t('success.profileUpdated') });
    } catch (error) {
      console.error("Error updating customer data:", error);
      setFeedbackMessage({ type: 'error', message: t('errors.updateFailed') });
    }
  };

  const formatTimestamp = (timestamp: Timestamp | string | undefined | null): string => {
    if (!timestamp) return 'N/A';
    try {
      const date = (timestamp instanceof Timestamp) ? timestamp.toDate() : new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString(i18n.language, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error("Error formatting date:", e, "Timestamp:", timestamp);
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | undefined | null, defaultValue: string = '0.00'): string => {
    if (amount === undefined || amount === null) return `د.ع${defaultValue}`; // IQD symbol
    return amount.toLocaleString(i18n.language === 'ar' ? 'ar-IQ' : 'en-US', {
      style: 'currency',
      currency: 'IQD', // Iraqi Dinar
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const iraqiCities = [
    "بغداد", "البصرة", "الموصل", "أربيل", "السليمانية", "كركوك", "النجف", "كربلاء",
    "الحلة", "الناصرية", "العمارة", "الديوانية", "الكوت", "دهوك", "الرمادي", "الفلوجة",
    "سامراء", "بعقوبة", "تكريت", "زاخو"
  ];

  const isRtl = i18n.dir(i18n.language) === 'rtl';
  const textDir = isRtl ? 'rtl' : 'ltr';

  if (serverError && !initialCustomerData) { // If there was a server error and no data could be loaded
    return (
      <div className="container mx-auto p-4 max-w-5xl text-center py-10">
        <Alert variant="destructive">
          <AlertTitle>{t('errors.error')}</AlertTitle>
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-red-600">{t('customerNotFound')}</h2>
        <p>{t('errors.noCustomerAccount')}</p>
        {/* Optionally, guide user to login or contact support */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl" dir={textDir}>
      {feedbackMessage && (
        <Alert variant={feedbackMessage.type === 'error' ? 'destructive' : 'default'} className="mb-4">
          <AlertTitle>{feedbackMessage.type === 'error' ? t('errors.error') : t('success.success')}</AlertTitle>
          <AlertDescription>{feedbackMessage.message}</AlertDescription>
        </Alert>
      )}
      <div className="bg-white dark:bg-muted rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 p-6">
          <div className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} justify-between items-center`}>
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h1 className="text-2xl font-bold text-white dark:text-foreground">{customer.name || t('common.guest')}</h1>
              <p className="text-blue-100 dark:text-blue-200">ID: {customerId || 'N/A'}</p>
            </div>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <Button
                variant={isEditing ? "outline" : "secondary"}
                onClick={handleEditToggle}
                className={`${isEditing ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100" : "bg-white dark:bg-muted text-blue-600 dark:text-blue-300"}`}
              >
                {isEditing ? t("common.cancel") : t("common.edit")}
              </Button>
              {isEditing && (
                <Button
                  onClick={handleSaveChanges}
                  className="bg-green-500 dark:bg-green-700 text-white hover:bg-green-600 dark:hover:bg-green-800"
                >
                  {t('saveChanges')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`flex border-b border-border dark:border-muted-foreground ${isRtl ? 'flex-row-reverse justify-end' : ''}`}>
          {['info', 'orders', 'stats'].map((tabKey) => (
            <button
              key={tabKey}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === tabKey
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-300'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100'
              }`}
              onClick={() => handleTabChange(tabKey)}
            >
              {t(tabKey === 'info' ? 'customerInfo' : tabKey === 'orders' ? 'orderHistory' : 'statistics')}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <DynamicPersonalInformation
            customer={customer}
            editedCustomer={editedCustomer}
            isEditing={isEditing}
            handleInputChange={handleInputChange}
            t={t}
            textDir={textDir}
            formatTimestamp={formatTimestamp}
            iraqiCities={iraqiCities}
          />
        )}

        {activeTab === 'orders' && (
          <DynamicOrderHistory
            orderHistory={orderHistory}
            t={t}
            isRtl={isRtl}
            formatCurrency={formatCurrency}
            formatTimestamp={formatTimestamp}
            setSelectedOrder={setSelectedOrder}
            setIsOrderDialogOpen={setIsOrderDialogOpen}
          />
        )}

        {activeTab === 'stats' && (
          <DynamicCustomerStatistics
            customer={customer}
            t={t}
            isRtl={isRtl}
            formatCurrency={formatCurrency}
            formatTimestamp={formatTimestamp}
          />
        )}
      </div>

      {isOrderDialogOpen && selectedOrder && (
        <DynamicOrderDetailsDialog
          selectedOrder={selectedOrder}
          isRtl={isRtl}
          formatTimestamp={formatTimestamp}
          formatCurrency={formatCurrency}
          setIsOrderDialogOpen={setIsOrderDialogOpen}
          t={t}
        />
      )}
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<AccountPageProps> = withAuth<Omit<AccountPageProps, 'user'>>(
  async (context, auth) => {
    const { user } = auth;
    const customerId = user.uid;

    if (!dbAdmin) {
        console.error("Firebase Admin SDK is not initialized. Cannot fetch data.");
        return { props: { customerData: null, ordersData: [], error: "Server configuration error." } };
    }

    try {
      const customerDocRef = dbAdmin.collection("customers").doc(customerId);
      const customerSnapshot = await customerDocRef.get();

      let customerData: CustomerProfile | null = null;
      if (customerSnapshot.exists) {
        const rawData = customerSnapshot.data();
        if (rawData) {
            customerData = {
              id: customerSnapshot.id,
              name: rawData.name,
              email: rawData.email,
              phone: rawData.phone,
              joinDate: rawData.joinDate instanceof admin.firestore.Timestamp ? rawData.joinDate.toDate().toISOString() : rawData.joinDate,
              address: rawData.address,
              totalSpent: rawData.totalSpent,
              totalOrders: rawData.totalOrders,
              lastOrder: rawData.lastOrder instanceof admin.firestore.Timestamp ? rawData.lastOrder.toDate().toISOString() : rawData.lastOrder,
            };
        }
      } else {
        console.warn(`Customer document not found for ID: ${customerId} in getServerSideProps.`);
      }

      const ordersQuery = dbAdmin.collection("orders").where("customerId", "==", customerId);
      const orderSnapshots = await ordersQuery.get();
      const ordersData: OrderInfo[] = orderSnapshots.docs.map(orderDoc => {
        const data = orderDoc.data();
        return {
          id: orderDoc.id,
          customerId: data.customerId,
          date: data.date instanceof admin.firestore.Timestamp ? data.date.toDate().toISOString() : data.date,
          total: data.total,
          status: data.status,
          items: data.items?.map((itemData: Record<string, unknown>): OrderItemInfo => ({
              id: typeof itemData.id === 'string' ? itemData.id : null,
              productId: typeof itemData.productId === 'string' ? itemData.productId : null,
              name: typeof itemData.name === 'string' ? itemData.name : null,
              image: typeof itemData.image === 'string' ? itemData.image : null,
              quantity: typeof itemData.quantity === 'number' ? itemData.quantity : null,
              price: typeof itemData.price === 'number' ? itemData.price : null,
              total: typeof itemData.total === 'number' ? itemData.total : null,
          })) || [],
          shippingAddress: data.shippingAddress || null,
          paymentMethod: data.paymentMethod,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          subtotal: data.subtotal,
          shipping: data.shipping,
          discount: data.discount,
        };
      });

      return {
        props: {
          customerData,
          ordersData,
        },
      };
    } catch (error: unknown) {
      console.error("Error fetching customer data in getServerSideProps (account.tsx):", error);
      let errorMessage = "Failed to load account data.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return { props: { customerData: null, ordersData: [], error: errorMessage } };
    }
  },
  {
    redirectTo: '/auth?reason=unauthenticated&returnTo=/account',
  }
);

export default AccountPage;