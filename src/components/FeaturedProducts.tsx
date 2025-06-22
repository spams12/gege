import { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Product } from "@/types";
import ProductCard from "./ProductCard"; // Changed from ProductGrid to ProductCard
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import chevron icons
import { Button } from "@/components/ui/button"; // Add Button import
import Link from "next/link"; // Add Link import

interface FeaturedProductsProps {
  products: Product[];
  loading: boolean;
}

const FeaturedProducts = ({ products, loading }: FeaturedProductsProps) => {
  const { t, i18n } = useTranslation(); // Get translation and i18n
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(true);
  const [showStartArrow, setShowStartArrow] = useState(false);
  const [showEndArrow, setShowEndArrow] = useState(true);

  // Only filter featured products from the passed products
  const featuredProducts = products.filter((product) => product.isFeatured);

  const scroll = (direction: 'start' | 'end') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; // Adjust as needed
      const actualDirection = (direction === 'start') ? -1 : 1;
      
      // In RTL mode, we need to reverse the scroll direction
      const finalDirection = isRTL ? -actualDirection : actualDirection;
      
      scrollContainerRef.current.scrollBy({
        left: scrollAmount * finalDirection,
        behavior: 'smooth'
      });
    }
  };

  // Monitor scroll position to update arrow visibility
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const hasReachedStart = isRTL ? 
        scrollLeft >= -10 : // For RTL, scrollLeft approaches 0 when at start
        scrollLeft <= 10;   // For LTR, scrollLeft approaches 0 when at start
      
      const hasReachedEnd = isRTL ?
        Math.abs(scrollLeft) >= (scrollWidth - clientWidth - 10) : // For RTL
        scrollLeft >= (scrollWidth - clientWidth - 10);            // For LTR
      
      setShowStartArrow(!hasReachedStart);
      setShowEndArrow(!hasReachedEnd);
    }
  };

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkScrollPosition);
      // Initial check after render
      setTimeout(checkScrollPosition, 100);
      
      return () => {
        scrollContainer.removeEventListener('scroll', checkScrollPosition);
      };
    }
  }, [isRTL]);

  const ProductCardSkeleton = () => (
      <div className="flex-shrink-0 w-[280px] space-y-2 bg-card border border-border rounded-lg p-3 shadow-sm">
          <Skeleton className="h-48 w-full rounded bg-muted" />
          <Skeleton className="h-5 w-3/4 bg-muted" />
          <Skeleton className="h-4 w-1/2 bg-muted" />
          <div className="flex justify-between items-center pt-2">
             <Skeleton className="h-6 w-1/3 bg-muted" />
             <Skeleton className="h-8 w-1/4 bg-muted" />
          </div>
      </div>
  );

  return (
    <section className="py-16 bg-brand-orange-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white">
            {t('homePage.featuredProducts')}
          </h2>
          <Link href="/products?featured=true">
            <Button variant="outline" className="border-brand-orange-500 text-brand-orange-500 hover:bg-brand-orange-500 hover:text-white transition-all duration-300 font-semibold">
              {t('common.viewAll')}
            </Button>
          </Link>
        </div>
        {loading ? (
           <div className="flex gap-6 overflow-x-auto pb-5 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="snap-start">
                  <ProductCardSkeleton />
                </div>
              ))}
           </div>
        ) : (
           <div className="relative group/featured">
             {/* Navigation Arrows */}
             {showArrows && (
               <>
                 {/* Start edge arrow */}
                 {showStartArrow && (
                   <button
                     onClick={() => scroll('start')}
                     className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-brand-orange-500 hover:bg-white hover:shadow-xl transition-all duration-300 opacity-0 group-hover/featured:opacity-100 transform ${isRTL ? 'translate-x-1/2' : '-translate-x-1/2'}`}
                     aria-label="Previous product"
                   >
                     {isRTL ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                   </button>
                 )}
                 
                 {/* End edge arrow */}
                 {showEndArrow && (
                   <button
                     onClick={() => scroll('end')}
                     className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-brand-orange-500 hover:bg-white hover:shadow-xl transition-all duration-300 opacity-0 group-hover/featured:opacity-100 transform ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'}`}
                     aria-label="Next product"
                   >
                     {isRTL ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                   </button>
                 )}
               </>
             )}
             
             {/* Scrollable product container */}
             <div
               ref={scrollContainerRef}
               className="flex gap-6 overflow-x-auto pb-5 snap-x px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
               style={{ direction: isRTL ? 'rtl' : 'ltr' }}
             >
                {featuredProducts.map((product) => (
                  <div key={product.id} className="snap-start flex-shrink-0 w-[300px]">
                    <ProductCard product={product} />
                  </div>
                ))}
             </div>
           </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;