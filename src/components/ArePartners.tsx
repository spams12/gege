import { useState, useContext } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AuthContext } from '@/contexts/AuthContext';

const iraqiCities = [
  "بغداد", "البصرة", "الموصل", "أربيل", "السليمانية", "كركوك", "النجف", "كربلاء",
  "الحلة", "الناصرية", "العمارة", "الديوانية", "الكوت", "دهوك", "الرمادي", "الفلوجة",
  "سامراء", "بعقوبة", "تكريت", "زاخو"
];

// Zod schema for validation
const createPartnerSchema = (t: (key: string) => string) => z.object({
  fullName: z.string().min(1, { message: t('common.requiredField') }),
  city: z.string().min(1, { message: t('checkoutPage.validation.cityRequired') }),
  address: z.string().min(5, { message: t('checkoutPage.validation.addressMin') }),
  nearestLandmark: z.string().min(1, { message: t('common.requiredField') }),
  phone: z.string().regex(/^07[0-9]{9}$/, { message: t('checkoutPage.validation.phoneRegex') }),
  country: z.string().min(1, { message: t('common.requiredField') }),
});

type PartnerFormValues = z.infer<ReturnType<typeof createPartnerSchema>>;

const defaultValues: PartnerFormValues = {
  fullName: '',
  address: '',
  nearestLandmark: '',
  phone: '',
  city: '',
  country: 'العراق',
};

const ArePartners = () => {
  const [submitted, setSubmitted] = useState(false);
  const { t, i18n } = useTranslation();
  const { currentUser } = useContext(AuthContext);
  const partnerSchema = createPartnerSchema(t);
  const methods = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues,
  });
  const { handleSubmit, control, setValue, watch, formState: { errors } } = methods;
  const currentLanguage = i18n.language;

  const onSubmit = async (data: PartnerFormValues) => {
    try {
      const timestamp = new Date().toISOString();
      
      const order = {
        assignedUsers: [],
        comments: [],
        completedAt: timestamp,
        completedBy: "",
        createdAt: new Date().toLocaleString('en-US', { timeZone: 'UTC' }).replace(/\//g, '-'),
        creatorId: "",
        creatorName: "",
        customerEmail: `${data.city} ${data.address} ${data.nearestLandmark}`,
        customerId: "",
        customerName: data.fullName,
        customerPhone: data.phone,
        date: new Date().toLocaleString('en-US', { timeZone: 'UTC' }).replace(/\//g, '-'),
        description: "",
        invoices: [],
        lastUpdated: timestamp,
        priority: "",
        status: "",
        title: ``,
        type: "",
        userResponses: [],
      };
      
      await addDoc(collection(db, 'newserviceRequests'), order);
      setSubmitted(true);
      toast({
        title: t('homePage.arePartners.success'),
        description: t('homePage.arePartners.successDesc')
      });
    } catch (error) {
      toast({
        title: t('homePage.arePartners.error'),
        description: t('homePage.arePartners.errorDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="py-12 bg-white dark:bg-muted/20 border-t border-b border-border">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
        {/* Logo and text */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-start">
          <h2 className="text-3xl font-bold mb-2 blue">{t('homePage.arePartners.title')}</h2>
          <img src="/newlogo.png" alt="Logo" className="w-32 h-32 mb-4 object-contain" />

          <p className="text-lg text-muted-foreground mb-4">{t('homePage.arePartners.description')}</p>
        </div>
        {/* Forms */}
        <div className="flex-1 max-w-md w-full bg-card p-6 rounded-lg shadow-lg border border-border">
          {submitted ? (
            <div className="text-center text-green-600 font-bold text-xl py-8">{t('homePage.arePartners.success')}</div>
          ) : (
            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <FormItem>
                  <FormLabel>{t('homePage.arePartners.fullName')}</FormLabel>
                  <FormControl>
                    <Input {...methods.register('fullName')} placeholder={t('homePage.arePartners.fullNamePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>{t('checkoutPage.city')}</FormLabel>
                  <FormControl>
                    <Select
                      value={watch('city')}
                      onValueChange={value => setValue('city', value)}
                      dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={t('checkoutPage.selectCity')} />
                      </SelectTrigger>
                      <SelectContent>
                        {iraqiCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>{t('homePage.arePartners.address')}</FormLabel>
                  <FormControl>
                    <Textarea {...methods.register('address')} placeholder={t('homePage.arePartners.addressPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>{t('homePage.arePartners.nearestLandmark')}</FormLabel>
                  <FormControl>
                    <Input {...methods.register('nearestLandmark')} placeholder={t('homePage.arePartners.nearestLandmarkPlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>{t('homePage.arePartners.phone')}</FormLabel>
                  <FormControl>
                    <Input {...methods.register('phone')} placeholder={t('homePage.arePartners.phonePlaceholder')} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <Button type="submit" className="w-full bg-blue-500 text-white hover:bg-blue-700/90">{t('homePage.arePartners.submit')}</Button>
              </form>
            </FormProvider>
          )}
        </div>
      </div>
    </section>
  );
};

export default ArePartners; 