import Link from "next/link"; // Changed from react-router-dom
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import Head from "next/head"; // Added for setting page title
const AlertCircle = dynamic(() => import('lucide-react').then(mod => mod.AlertCircle), { ssr: false });
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
import { useRouter } from "next/router"; // Import useRouter

const NotFound = () => {
  const router = useRouter(); // Changed from useLocation
  const { t } = useTranslation(); 

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      router.asPath // Changed from location.pathname to router.asPath for Next.js
    );
  }, [router.asPath]); // Changed from location.pathname

  return (
    <>
      <Head>
        <title>{t('notFoundPage.title')}</title>
      </Head>
      <div className="min-h-[70vh] flex items-center justify-center bg-background dark:bg-muted/20">
        <div className="text-center px-4">
          <AlertCircle className="mx-auto h-16 w-16 text-qabas-blue mb-6" />
          <h1 className="text-5xl font-bold mb-4 text-qabas-blue">
            {t('notFoundPage.title')}
          </h1>
          <p className="text-2xl text-foreground/90 dark:text-foreground/80 mb-6">
            {t('notFoundPage.heading')}
          </p>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t('notFoundPage.message')}
          </p>
          <Button asChild className="bg-qabas-blue hover:bg-qabas-blue/90 text-white dark:text-white">
            <Link href="/">{t('notFoundPage.backToHome')}</Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default NotFound;