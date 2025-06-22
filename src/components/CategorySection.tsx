import Link from "next/link";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { useCategories } from "@/contexts/CategoryContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button"; // Add Button import
import type { Category } from '@/types';

// Define category images mapping (use only imageUrl or placeholder)
const getCategoryImage = (category: Category) => {
  return category.imageUrl || "https://via.placeholder.com/450";
};

// Helper to get localized category name
const getLocalizedName = (item: { nameEn: string; nameAr: string }, lang: string) => {
    return lang === 'ar' ? item.nameAr : item.nameEn;
};

// Helper to get localized category description
const getCategoryDescription = (categoryId: string, lang: string) => {
  const descriptions: Record<string, { en: string; ar: string }> = {
    "cpus": {
      en: "High-performance processors for building or upgrading your computer",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "gpus": {
      en: "Graphics cards for gaming and professional use",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "motherboards": {
      en: "Motherboards for various processor types and specifications",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "ram": {
      en: "Memory modules for improved system performance",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "storage": {
      en: "Storage solutions including SSDs and hard drives",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "monitors": {
      en: "Display monitors with various sizes and specifications",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "keyboards": {
      en: "Gaming and professional keyboards",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "mice": {
      en: "Gaming and ergonomic mice",
      ar: "مكونات وقطع عالية الأداء لبناء أو ترقية جهاز الكمبيوتر الخاص بك"
    },
    "laptops": {
      en: "Gaming laptops with powerful GPUs and processors",
      ar: "أجهزة الكمبيوتر المحمولة للألعاب مع وحدات معالجة رسومات ومعالجات قوية"
    }
  };
  
  return lang === 'ar' ? descriptions[categoryId]?.ar : descriptions[categoryId]?.en;
};

const CategorySection = () => {
  const { t, i18n } = useTranslation(); // Get translation
  const { categories } = useCategories();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showArrows, setShowArrows] = useState(true);
  const [showStartArrow, setShowStartArrow] = useState(false);
  const [showEndArrow, setShowEndArrow] = useState(true);

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
  const checkScrollPosition = useCallback(() => {
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
  }, [isRTL]);

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
  }, [isRTL, checkScrollPosition]);

  return (
    <section className="py-16 bg-brand-orange-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-4xl font-extrabold text-gray-800 dark:text-white">
            {isRTL ? "تسوق حسب الفئة" : "Shop by Category"}
          </h2>
          <Link href="/products">
            <Button variant="outline" className="border-brand-orange-500 text-brand-orange-500 hover:bg-brand-orange-500 hover:text-white transition-all duration-300 font-semibold">
              {t('common.viewAll')}
            </Button>
          </Link>
        </div>
        
        <div className="relative group">
          {showArrows && (
            <>
              {showStartArrow && (
                <button
                  onClick={() => scroll('start')}
                  className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-brand-orange-500 hover:bg-white hover:shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform ${isRTL ? 'translate-x-1/2' : '-translate-x-1/2'}`}
                  aria-label="Previous category"
                >
                  {isRTL ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </button>
              )}
              {showEndArrow && (
                <button
                  onClick={() => scroll('end')}
                  className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/80 backdrop-blur-sm shadow-lg rounded-full flex items-center justify-center text-brand-orange-500 hover:bg-white hover:shadow-xl transition-all duration-300 opacity-0 group-hover:opacity-100 transform ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'}`}
                  aria-label="Next category"
                >
                  {isRTL ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                </button>
              )}
            </>
          )}
          
          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] snap-x px-2"
            style={{ direction: isRTL ? 'rtl' : 'ltr' }}
          >
            {categories.filter(cat => cat.parentId == null).map((category) => {
              const categorySlug = category.slug || category.id;
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${categorySlug}`}
                  className="relative group rounded-2xl overflow-hidden flex-shrink-0 snap-start shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                  style={{ width: '350px' }}
                >
                  <div className="relative aspect-w-16 aspect-h-9">
                    <img
                      src={getCategoryImage(category)}
                      alt={getLocalizedName(category, currentLanguage)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
                  </div>
                  <div className={`absolute bottom-0 p-6 w-full ${isRTL ? 'right-0 text-right' : 'left-0 text-left'}`}>
                    <h3 className="text-3xl font-black text-white mb-2 drop-shadow-lg">
                      {getLocalizedName(category, currentLanguage)}
                    </h3>
                    <p className="text-md text-gray-200 max-w-md drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {getCategoryDescription(category.slug, currentLanguage)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;