import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

export type HeroBannerItem = {
  imageUrl: string;
  productId: string;
};

interface HeroBannerProps {
  banners?: HeroBannerItem[];
}

const HeroBanner: React.FC<HeroBannerProps> = ({ banners }) => {
  const { t, i18n } = useTranslation();
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const isRTL = i18n.dir(i18n.language) === "rtl";

  const carouselItems = banners && banners.length > 0
    ? banners.map((b) => ({
        name: b.productId,
        image: b.imageUrl,
        altKey: b.productId, // Consider adding a more descriptive alt text if available
        route: `/products/${b.productId}`,
      }))
    : [];

  useEffect(() => {
    if (carouselItems.length <= 1) return; // Don't auto-scroll if 0 or 1 item
    const intervalId = setInterval(() => {
      setCurrent((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(intervalId);
  }, [carouselItems.length]);

  const handlePrev = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrent((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrent((prev) => (prev === carouselItems.length - 1 ? 0 : prev + 1));
  };

  const handleIndicatorClick = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrent(index);
  }

  const handleSlideClick = (route?: string) => {
      if (route) {
        router.push(route);
      }
  };

  // Return null or a placeholder if no banners to avoid errors
  if (!carouselItems || carouselItems.length === 0) {
    return (
        <div className="text-foreground">
             <div className="container mx-auto px-4 py-8 md:py-12">
                {/* Optional: Placeholder when no banners */}
                <div className="w-full aspect-[16/9] relative overflow-hidden rounded-lg shadow-lg bg-muted flex items-center justify-center">
                    <p className="text-muted-foreground">No banners available.</p>
                </div>
                {/* Keep Text section even if no banners? Your choice */}
                {/* ... text section ... */}
             </div>
        </div>
    );
  }

  return (
    <div className="bg-brand-orange-50 dark:bg-gray-900 text-foreground">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col w-full items-center">
          {/* Carousel Container */}
          <div className="w-full aspect-[16/9] relative overflow-hidden rounded-2xl shadow-2xl group bg-muted">
            {/* Slides Container */}
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(${isRTL ? current * 100 : -current * 100}%)` }}
            >
              {carouselItems.map((item) => (
                <div
                  key={item.name + '-' + item.image} // Ensure unique key
                  className="min-w-full h-full flex-shrink-0 cursor-pointer bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${item.image})` }}
                  onClick={() => handleSlideClick(item.route)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${item.altKey}`}
                >
                </div>
              ))}
            </div>

            {/* Text Overlay with proper centering and padding */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20">
                <div className="w-full max-w-4xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 text-center" style={{ pointerEvents: 'auto' }}>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight mb-3 md:mb-4 tracking-tight drop-shadow-2xl break-words">
                        {t('homePage.heroTitle')}
                    </h1>
                  
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 dark:text-gray-300 mb-6 md:mb-8 lg:mb-10 leading-relaxed drop-shadow-lg break-words max-w-3xl mx-auto">
                        {t('homePage.heroDescription')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 md:gap-5">
                        <Button
                            size="lg"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 sm:px-12 md:px-14 py-2 md:py-3 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-300 text-sm sm:text-base"
                            onClick={() => router.push('/products')}
                        >
                            {t('homePage.shopNow')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Controls (Only show if more than 1 item) */}
            {carouselItems.length > 1 && (
              <>
                <button
                  className="absolute top-1/2 left-3 md:left-5 -translate-y-1/2 bg-card/80 hover:bg-card text-primary rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 transform hover:scale-110"
                  onClick={handlePrev}
                  aria-label={t('biddingDetailPage.previousImage')}
                  type="button"
                >
                   {isRTL ? <ChevronRight className="h-7 w-7"/> : <ChevronLeft className="h-7 w-7"/> }
                </button>
                <button
                  className="absolute top-1/2 right-3 md:right-5 -translate-y-1/2 bg-card/80 hover:bg-card text-primary rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 transform hover:scale-110"
                  onClick={handleNext}
                  aria-label={t('biddingDetailPage.nextImage')}
                  type="button"
                >
                   {isRTL ? <ChevronLeft className="h-7 w-7"/> : <ChevronRight className="h-7 w-7"/> }
                </button>

                {/* Indicators */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex justify-center gap-3 z-30">
                  {carouselItems.map((_, idx) => (
                    <button
                      key={`indicator-${idx}`}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === current ? "bg-primary scale-125" : "bg-card/70 hover:bg-card"}`}
                      onClick={(e) => handleIndicatorClick(idx, e)}
                      aria-label={`Go to slide ${idx + 1}`}
                      type="button"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;