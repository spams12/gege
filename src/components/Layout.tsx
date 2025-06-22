import * as React from 'react';
import Header from "./Header";
import Footer from "./Footer";
import { Suspense } from 'react';
import { useCategories } from '@/contexts/CategoryContext';
import { useTranslation } from 'react-i18next';

// Improved loading spinner component
const LoadingSpinner = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="relative">
        {/* Spinner animation */}
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        
        {/* Inner spinner for additional effect */}
        <div className="absolute top-1 left-1 w-14 h-14 border-4 border-primary/50 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
      </div>
      
      {/* Loading text in Arabic and English */}
      <div className="mt-4 text-lg font-medium text-primary">
        <span className="block text-center" lang="ar" dir="rtl">جاري التحميل...</span>
        <span className="block text-center">{t('loading')}</span>
      </div>
    </div>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { categories } = useCategories();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div 
        className="min-h-screen flex flex-col bg-background text-foreground"
        dir={isRTL ? "rtl" : "ltr"} // Set text direction based on language
      >
        {/* Header */}
        <Header categories={categories} />
        
        {/* Main content area */}
        <main className="flex-1">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
        
      </div>
    </Suspense>
  );
};

export default Layout;