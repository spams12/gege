import type { AppProps } from 'next/app';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import dynamic from 'next/dynamic';

const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), { ssr: false });
const Sonner = dynamic(() => import('@/components/ui/sonner').then(mod => mod.Toaster), { ssr: false });

import { AuthProvider } from '@/contexts/AuthContext';
import { UserProvider } from '@/contexts/UserContext';
import { CategoryProvider } from "@/contexts/CategoryContext";
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const Layout = dynamic(() => import('@/components/Layout'), { ssr: false });
const ScrollToTop = dynamic(() => import('@/components/ScrollToTop'), { ssr: false });

import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n';

// Global styles
import '@/index.css';
import '@/App.css';

const queryClient = new QueryClient();

// Suspense fallback spinner
const loadingFallback = (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Suspense fallback={loadingFallback}>
          <I18nextProvider i18n={i18n}>
            <ThemeProvider defaultTheme="system" storageKey="qabas-ui-theme">
              <AuthProvider>
                <UserProvider>
                  <CategoryProvider>
                    <CartProvider>
                      <WishlistProvider>
                        <Layout>
                          <ScrollToTop />
                          <Component {...pageProps} />
                        </Layout>
                      </WishlistProvider>
                    </CartProvider>
                  </CategoryProvider>
                </UserProvider>
              </AuthProvider>
            </ThemeProvider>
          </I18nextProvider>
        </Suspense>
        <Toaster />
        <Sonner richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default MyApp;