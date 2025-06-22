import * as React from 'react'; // Changed from 'react'
import Link from 'next/link'; // Changed from react-router-dom
import { useRouter } from 'next/router'; // Changed from react-router-dom
import { useTranslation } from 'react-i18next'; 

const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
const Card = dynamic(() => import('@/components/ui/card').then(mod => mod.Card), { ssr: false });
const CardContent = dynamic(() => import('@/components/ui/card').then(mod => mod.CardContent), { ssr: false });
const CardHeader = dynamic(() => import('@/components/ui/card').then(mod => mod.CardHeader), { ssr: false });
const CardTitle = dynamic(() => import('@/components/ui/card').then(mod => mod.CardTitle), { ssr: false });
import dynamic from 'next/dynamic';
const CheckCircle = dynamic(() => import('lucide-react').then(mod => mod.CheckCircle), { ssr: false });
const AlertTriangle = dynamic(() => import('lucide-react').then(mod => mod.AlertTriangle), { ssr: false });

const CompleteOrderPage: React.FC = () => {
  const { t } = useTranslation(); 
  const router = useRouter(); // Changed from useLocation
  // Wait for the router to be ready before accessing query parameters
  if (!router.isReady) {
    // TODO: Consider a more sophisticated loading state, e.g., a skeleton loader
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <p>{t('loading', 'Loading...')}</p>
      </div>
    );
  }

  const { orderId } = router.query;

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md text-center shadow-lg bg-card text-card-foreground border">
          <CardHeader>
            <div className="mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full p-3 w-fit">
              <AlertTriangle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="mt-4 text-2xl font-bold">
              {t('completeOrderPage.errorTitle', 'Order Information Missing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {t('completeOrderPage.noOrderInfoMessage', 'No order ID was found. If you recently placed an order, please check your account or contact support.')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild className="bg-qabas-blue hover:bg-qabas-blue/90 text-white dark:text-white">
                <Link href="/account">{t('completeOrderPage.viewOrderHistory', 'View Order History')}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">{t('completeOrderPage.continueShopping', 'Continue Shopping')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success case: orderId is present
  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-md text-center shadow-lg bg-card text-card-foreground border">
        <CardHeader>
          <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3 w-fit">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="mt-4 text-2xl font-bold">
            {t('completeOrderPage.title', 'Order Confirmed!')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            {t('completeOrderPage.message', 'Thank you for your purchase. Your order has been successfully placed.')}
          </p>
          <div className="mb-4 text-lg font-semibold text-qabas-blue">
            {t('completeOrderPage.orderIdLabel', 'Your Order ID: {{orderId}}', { orderId })}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="bg-qabas-blue hover:bg-qabas-blue/90 text-white dark:text-white">
              <Link href="/">{t('completeOrderPage.continueShopping', 'Continue Shopping')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/account">{t('completeOrderPage.viewOrderHistory', 'View Order History')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteOrderPage;