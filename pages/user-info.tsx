import * as React from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router'; // Changed from react-router-dom
import { useTranslation } from 'react-i18next';
import { auth } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Dynamically import UI components to reduce initial JS bundle size
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const iraqiCities = [
  "بغداد", "البصرة", "الموصل", "أربيل", "السليمانية", "كركوك", "النجف", "كربلاء",
  "الحلة", "الناصرية", "العمارة", "الديوانية", "الكوت", "دهوك", "الرمادي", "الفلوجة",
  "سامراء", "بعقوبة", "تكريت", "زاخو"
];

const UserInfoStep: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const router = useRouter(); // Changed from useNavigate
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Zod schema
  const schema = React.useMemo(() => z.object({
    fullName: z.string().min(1, t('userInfoStep.requiredFields')),
    phone: z.string().regex(/^07[0-9]{9}$/, t('checkoutPage.validation.phoneRegex')),
    address: z.string().min(5, t('checkoutPage.validation.addressMin')),
    city: z.string().min(1, t('checkoutPage.validation.cityRequired')),
    country: z.string().min(1, t('userInfoStep.requiredFields')),
    street: z.string().min(1, t('userInfoStep.requiredFields')),
  }), [t]);
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      city: '',
      country: 'العراق',
      street: '',
    },
  });

  const handleSubmit = async (data: FormValues) => {
    setError(null);
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError(t('userInfoStep.notLoggedIn') || 'You must be logged in.');
        setLoading(false);
        return;
      }
      // The 'address' field here is the full address, while 'city', 'country', 'street' are separate.
      // This structure is based on the original code.
      await setDoc(doc(db, 'customers', user.uid), {
        name: data.fullName, // Using fullName for 'name' field
        phone: data.phone,
        email: user.email,
        address: { // Nested address object
          city: data.city,
          country: data.country,
          street: data.street,
          full: data.address, // 'address' from form is the full address string
        },
        joinDate: serverTimestamp(),
        lastOrder: serverTimestamp(),
        status: 'نشط',
        totalOrders: 0,
        totalSpent: 0,
        orders: [], // Initialize as empty array
        uid: user.uid,
      }, { merge: true });
      router.push('/'); // Changed from navigate
    } catch (err) {
      setError(t('userInfoStep.saveError') || 'Failed to save info.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {t('userInfoStep.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-6 border-b border-border" />
          {error && <div className="mb-2 text-red-600 text-sm text-center">{error}</div>}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('userInfoStep.fullName')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('userInfoStep.fullName') + '...'} autoFocus />
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
                    <FormLabel>{t('userInfoStep.phone')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('checkoutPage.phonePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('userInfoStep.address')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('checkoutPage.addressPlaceholder')} />
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
                    <FormLabel>{t('userInfoStep.city')}</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value} dir={isRtl ? 'rtl' : 'ltr'}>
                          <SelectTrigger ref={field.ref} onBlur={field.onBlur} className="bg-background">
                            <SelectValue placeholder={t('checkoutPage.selectCity')} />
                          </SelectTrigger>
                        <SelectContent>
                          {iraqiCities.map((cityOption) => (
                            <SelectItem key={cityOption} value={cityOption}>{cityOption}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('userInfoStep.country')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('userInfoStep.country') + '...'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('userInfoStep.street')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('userInfoStep.street') + '...'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full rounded-full py-2 text-base font-semibold" disabled={loading}>{loading ? t('common.loading') : t('userInfoStep.saveButton')}</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserInfoStep;