import * as React from 'react';
import { GetServerSideProps, GetServerSidePropsContext } from 'next'; // Added for getServerSideProps
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { withAuth } from '@/utils/auth'; // Import the HOC
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next'; 
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
const Input = dynamic(() => import('@/components/ui/input').then(mod => mod.Input), { ssr: false });
const Select = dynamic(() => import('@/components/ui/select').then(mod => mod.Select), { ssr: false });
const SelectContent = dynamic(() => import('@/components/ui/select').then(mod => mod.SelectContent), { ssr: false });
const SelectItem = dynamic(() => import('@/components/ui/select').then(mod => mod.SelectItem), { ssr: false });
const SelectTrigger = dynamic(() => import('@/components/ui/select').then(mod => mod.SelectTrigger), { ssr: false });
const SelectValue = dynamic(() => import('@/components/ui/select').then(mod => mod.SelectValue), { ssr: false });
const Card = dynamic(() => import('@/components/ui/card').then(mod => mod.Card), { ssr: false });
const CardContent = dynamic(() => import('@/components/ui/card').then(mod => mod.CardContent), { ssr: false });
const CardHeader = dynamic(() => import('@/components/ui/card').then(mod => mod.CardHeader), { ssr: false });
const CardTitle = dynamic(() => import('@/components/ui/card').then(mod => mod.CardTitle), { ssr: false });
const CardFooter = dynamic(() => import('@/components/ui/card').then(mod => mod.CardFooter), { ssr: false });
const Form = dynamic(() => import('@/components/ui/form').then(mod => mod.Form), { ssr: false });
const FormControl = dynamic(() => import('@/components/ui/form').then(mod => mod.FormControl), { ssr: false });
const FormField = dynamic(() => import('@/components/ui/form').then(mod => mod.FormField), { ssr: false });
const FormItem = dynamic(() => import('@/components/ui/form').then(mod => mod.FormItem), { ssr: false });
const FormLabel = dynamic(() => import('@/components/ui/form').then(mod => mod.FormLabel), { ssr: false });
const FormMessage = dynamic(() => import('@/components/ui/form').then(mod => mod.FormMessage), { ssr: false });
import { useCart } from '@/contexts/CartContext'; // Adjusted path
import { toast } from 'sonner';
import { db, auth } from '@/lib/firebase'; // Adjusted path
// Removed addDoc, collection, Timestamp as order creation is now server-side
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseAuthUser, getIdToken } from 'firebase/auth'; // Renamed User to FirebaseAuthUser to avoid conflict, Added getIdToken
import { useState, useEffect } from 'react';

const iraqiCities = [
  "بغداد", "البصرة", "الموصل", "أربيل", "السليمانية", "كركوك", "النجف", "كربلاء",
  "الحلة", "الناصرية", "العمارة", "الديوانية", "الكوت", "دهوك", "الرمادي", "الفلوجة",
  "سامراء", "بعقوبة", "تكريت", "زاخو"
];

const createCheckoutSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(3, { message: t('checkoutPage.validation.nameRequired') }),
  email: z.string().email({ message: t('checkoutPage.validation.emailRequired') }),
  city: z.string().min(1, { message: t('checkoutPage.validation.cityRequired') }),
  address: z.string().min(5, { message: t('checkoutPage.validation.addressMin') }),
  phone: z.string().regex(/^07[0-9]{9}$/, { message: t('checkoutPage.validation.phoneRegex') }),
});


interface CheckoutFormShape {
  name: string;
  email: string;
  city: string;
  address: string;
  phone: string;
}
interface CheckoutPageProps {
  initialCustomerData?: CheckoutFormShape | null;
  user?: { uid: string; email?: string; displayName?: string } | null; // Added by withAuth
  error?: string;
}

const CheckoutPage: React.FC<CheckoutPageProps> = ({ initialCustomerData, user }) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { clearCart, getCartTotal, cartItems, shippingCost } = useCart();
  // currentUser from AuthContext can still be used for optimistic UI updates or if needed before SSR data hydration.
  // However, the `user` prop from `withAuth` is the server-verified user.
  const [clientSideUser, setClientSideUser] = useState<FirebaseAuthUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);

  const checkoutSchema = createCheckoutSchema(t);
  type CheckoutFormValues = z.infer<typeof checkoutSchema>;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: initialCustomerData || {
      name: user?.displayName || '',
      email: user?.email || '',
      city: '',
      address: '',
      phone: '',
    },
  });

  const cartTotal = getCartTotal();
  const currentLanguage = i18n.language;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setClientSideUser(fbUser);
      if (fbUser) {
        const currentFormValues = form.getValues();
        const newDefaultValues: Partial<CheckoutFormValues> = {};
        if (!currentFormValues.name && fbUser.displayName) newDefaultValues.name = fbUser.displayName;
        if (!currentFormValues.email && fbUser.email) newDefaultValues.email = fbUser.email;
        // Only reset if there are new default values to apply and initialCustomerData wasn't there
        if (Object.keys(newDefaultValues).length > 0 && !initialCustomerData) {
           form.reset({ ...currentFormValues, ...newDefaultValues });
        }
      } else if (!fbUser && initialCustomerData) {
        // User logged out on client, clear pre-filled data
        form.reset({ name: '', email: '', city: '', address: '', phone: '' });
      }
    });
    return () => unsubscribe();
  }, [form, initialCustomerData, user]); // Depend on SSR user prop as well


  const onSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    if (!clientSideUser) {
      toast.error(t('checkoutPage.notAuthenticatedError', 'You must be logged in to place an order.'));
      setIsSubmitting(false);
      router.push('/auth?returnTo=/checkout'); // Redirect to login
      return;
    }

    try {
      const token = await getIdToken(clientSideUser);

      const orderPayload = {
        customerDetails: {
          name: data.name,
          email: data.email,
          city: data.city,
          address: data.address,
          phone: data.phone,
        },
        cartItems: cartItems.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : '',
        })),
        shippingCost: shippingCost || 0,
        clientTotal: cartTotal + (shippingCost || 0),
      };

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific API error messages
        const errorMessage = result.error || t('checkoutPage.orderError');
        const errorCode = result.errorCode;
        let toastMessage = errorMessage;

        if (errorCode === 'PRICE_MISMATCH') {
            toastMessage = t('checkoutPage.errors.priceMismatch', { productName: result.productName || 'item', currentPrice: result.correctPrice, defaultValue: errorMessage });
        } else if (errorCode === 'INSUFFICIENT_STOCK') {
            toastMessage = t('checkoutPage.errors.insufficientStock', { productName: result.productName || 'item', availableStock: result.availableStock, defaultValue: errorMessage });
        }
        
        toast.error(toastMessage);
        console.error('Order submission error:', result);
      } else {
        setOrderCompleted(true);
        clearCart();
        toast.success(t('checkoutPage.orderSuccess'));
        router.push(`/complete-order?orderId=${result.orderId}`);
      }
    } catch (error) {
      console.error('Order submission fetch error:', error);
      toast.error(t('checkoutPage.orderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (cartItems.length === 0 && !orderCompleted) {
      toast.error(t('checkoutPage.emptyCartError'));
      router.push('/cart'); // Changed from navigate
    }
  }, [cartItems, router, t, orderCompleted]); // Changed navigate to router


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
        {t('checkoutPage.title')}
      </h1>
      <div className="flex flex-col md:flex-row gap-8 justify-center">
        <Card className="w-full md:max-w-lg bg-card text-card-foreground border">
          <CardHeader>
            <CardTitle>{t('checkoutPage.deliveryInfo')}</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkoutPage.fullName')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('checkoutPage.fullNamePlaceholder')}
                          {...field}
                          className="bg-background border-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkoutPage.email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t('checkoutPage.emailPlaceholder')}
                          {...field}
                          className="bg-background border-input"
                          dir="ltr" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkoutPage.city')}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value} 
                        dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} 
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('checkoutPage.selectCity')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {iraqiCities.map((city) => (
                            <SelectItem key={city} value={city}>
                              {city} 
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkoutPage.localAddress')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('checkoutPage.addressPlaceholder')}
                          {...field}
                          className="bg-background border-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('checkoutPage.phoneNumber')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={t('checkoutPage.phonePlaceholder')}
                          {...field}
                          className="bg-background border-input"
                           dir="ltr" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-4 border-t pt-4">
                 <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>{t('checkoutPage.subtotal', 'Subtotal')}</span>
                      <span>{cartTotal.toLocaleString()} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('checkoutPage.shipping', 'Shipping')}</span>
                      <span>{(shippingCost || 0).toLocaleString()} {t('common.currency')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                      <span>{t('checkoutPage.total')}</span>
                      <span>{(cartTotal + (shippingCost || 0)).toLocaleString()} {t('common.currency')}</span>
                    </div>
                  </div>
                <Button
                  type="submit"
                  className="w-full bg-qabas-blue hover:bg-qabas-blue/90 text-white dark:text-white mt-4"
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  {isSubmitting ? t('checkoutPage.processing', 'Processing...') : t('checkoutPage.confirmOrder')}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<CheckoutPageProps> = withAuth<Omit<CheckoutPageProps, 'user'>>(
  async (context, auth) => {
    const { user } = auth; // User object from withAuth (contains uid, email, etc.)
    let initialCustomerData: CheckoutPageProps['initialCustomerData'] = null;

    if (user) {
      try {
        const customerDocRef = doc(db, 'customers', user.uid);
        const customerSnap = await getDoc(customerDocRef);

        if (customerSnap.exists()) {
          const customerDbData = customerSnap.data() as DocumentData;
          initialCustomerData = {
            name: user.displayName || customerDbData.name || '',
            email: user.email || customerDbData.email || '',
            city: customerDbData.address?.city || '',
            address: customerDbData.address?.full || customerDbData.address?.street || '', // Prefer full, fallback to street
            phone: customerDbData.phone || '',
          };
        } else {
          // User is authenticated but no specific customer document exists yet.
          // Prefill with whatever information is available from the auth user object.
          initialCustomerData = {
            name: user.displayName || '',
            email: user.email || '',
            city: '',
            address: '',
            phone: '',
          };
        }
      } catch (error) {
        console.error("Error fetching customer data for checkout prefill (checkout.tsx):", error);
        // Fallback to basic prefill from auth user if DB fetch fails
        initialCustomerData = {
          name: user.displayName || '',
          email: user.email || '',
          city: '', // Add missing fields
          address: '', // Add missing fields
          phone: '', // Add missing fields
        };
      }
    }
    // If `user` is null (auth failed and no redirect), initialCustomerData remains null.
    // The form will initialize with empty defaults or whatever `user` prop (which would be null) provides.

    return {
      props: {
        initialCustomerData,
        // `user` prop is automatically passed by withAuth to the page component
      },
    };
  },
  {
    redirectTo: '/auth?reason=unauthenticated&returnTo=/checkout', // Optional: Redirect if not authenticated
    // If you don't want to force login for checkout, remove `redirectTo`.
    // The page will then load with `user` as null if not authenticated.
  }
);

export default CheckoutPage;