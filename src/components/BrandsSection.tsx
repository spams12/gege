import { useTranslation } from 'react-i18next';
import { fetchBrands, Brand } from "@/services/products";
import { useEffect, useState } from 'react';

const BrandsSection = () => {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBrands = async () => {
      setLoading(true);
      try {
        const fetchedBrands = await fetchBrands();
        setBrands(fetchedBrands);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    };

    getBrands();
  }, []);

  // Duplicate brands for seamless infinite scroll
  const marqueeBrands = [...brands, ...brands];

  return (
    <section className="py-16 bg-brand-orange-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-extrabold text-center mb-10 text-foreground">
          {t('homePage.trustedBrands')}
        </h2>
        <div className="relative group">
          <div className="absolute inset-0 z-10 [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]"></div>
          {loading ? (
            <p className="text-center text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <div className="flex gap-12 animate-marquee group-hover:[animation-play-state:paused]">
              {marqueeBrands.map((brand, idx) => (
                <div
                  key={brand.id + '-' + idx}
                  className="bg-card p-6 rounded-xl shadow-md flex items-center justify-center h-28 w-44 flex-shrink-0 border border-border hover:shadow-xl hover:border-brand-orange-300 transition-all duration-300 transform hover:-translate-y-1"
                  title={brand.name}
                >
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-12 object-contain max-w-full dark:invert"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`
          :root {
            --marquee-direction: -50%;
          }
          html[dir="rtl"] {
            --marquee-direction: 50%;
          }
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(var(--marquee-direction)); }
          }
          .animate-marquee {
            width: max-content;
            animation: marquee 30s linear infinite;
          }
        `}</style>
      </div>
    </section>
  );
};

export default BrandsSection;
