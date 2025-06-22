import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useCategories } from "@/contexts/CategoryContext";
import { Brand, Category } from "@/types";
import { Button } from "@/components/ui/button";
import dynamic from 'next/dynamic';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Checkbox = dynamic(() => import('@/components/ui/checkbox').then(mod => mod.Checkbox), { ssr: false });
const Slider = dynamic(() => import('@/components/ui/slider').then(mod => mod.Slider), { ssr: false });

interface FilterSidebarProps {
  selectedCategories: string[];
  selectedBrands: string[];
  priceRange: [number, number];
  inStock: boolean;
  selectedSpecs: { [specName: string]: string[] };
  initialBrands: Brand[];
  loading: boolean;
  productsError: string | null;
  handleBrandChange: (brandName: string) => void;
  handleCategoryChange: (categoryIdentifier: string) => void;
  handleSpecChange: (specName: string, option: string) => void;
  handlePriceRangeChange: (newRange: [number, number]) => void;
  handlePriceRangeCommit: (finalRange: [number, number]) => void;
  handleInStockChange: (checked: boolean) => void;
  resetFilters: () => void;
  currentLanguage: string;
  selectedCategoryObj: Category | undefined;
}

const FilterSidebar = ({
  selectedCategories,
  selectedBrands,
  priceRange,
  inStock,
  selectedSpecs,
  initialBrands,
  loading,
  productsError,
  handleBrandChange,
  handleCategoryChange,
  handleSpecChange,
  handlePriceRangeChange,
  handlePriceRangeCommit,
  handleInStockChange,
  resetFilters,
  currentLanguage,
  selectedCategoryObj,
}: FilterSidebarProps) => {
  const { t } = useTranslation();
  const { categories } = useCategories();

  // Optimistic state for faster UI feedback
  const [optimisticCategories, setOptimisticCategories] = useState(selectedCategories);
  const [optimisticBrands, setOptimisticBrands] = useState(selectedBrands);
  const [optimisticSpecs, setOptimisticSpecs] = useState(selectedSpecs);
  const [optimisticInStock, setOptimisticInStock] = useState(inStock);

  useEffect(() => {
    setOptimisticCategories(selectedCategories);
  }, [selectedCategories]);

  useEffect(() => {
    setOptimisticBrands(selectedBrands);
  }, [selectedBrands]);

  useEffect(() => {
    setOptimisticSpecs(selectedSpecs);
  }, [selectedSpecs]);

  useEffect(() => {
    setOptimisticInStock(inStock);
  }, [inStock]);

  const handleOptimisticCategoryChange = (identifier: string) => {
    const newCategories = optimisticCategories.includes(identifier)
      ? optimisticCategories.filter(c => c !== identifier)
      : [...optimisticCategories, identifier];
    setOptimisticCategories(newCategories);
    handleCategoryChange(identifier);
  };

  const handleOptimisticBrandChange = (brandName: string) => {
    const newBrands = optimisticBrands.includes(brandName)
      ? optimisticBrands.filter(b => b !== brandName)
      : [...optimisticBrands, brandName];
    setOptimisticBrands(newBrands);
    handleBrandChange(brandName);
  };

  const handleOptimisticSpecChange = (specName: string, option: string) => {
    const currentSpecOptions = optimisticSpecs[specName] || [];
    const newSpecOptions = currentSpecOptions.includes(option)
      ? currentSpecOptions.filter(o => o !== option)
      : [...currentSpecOptions, option];
    
    const newSpecs = {
      ...optimisticSpecs,
      [specName]: newSpecOptions,
    };
    if (newSpecs[specName]?.length === 0) {
      delete newSpecs[specName];
    }
    setOptimisticSpecs(newSpecs);
    handleSpecChange(specName, option);
  };
  
  const handleOptimisticInStockChange = (checked: boolean) => {
    setOptimisticInStock(checked);
    handleInStockChange(checked);
  };

  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-lg mb-3 text-foreground">{t('common.categories')}</h3>
        <Accordion type="multiple" className="w-full">
          {
            (() => {
              const parents = categories.filter((cat) => !cat.parentId);
              const children = categories.filter((cat) => cat.parentId);

              return parents.map((parent) => {
                const subCategories = children.filter(child => child.parentId === parent.id);

                if (subCategories.length === 0) {
                  return (
                    <div key={parent.id} className="flex items-center py-2">
                      <Checkbox
                        id={`category-${parent.id}`}
                        checked={optimisticCategories.includes(parent.slug || parent.id)}
                        onCheckedChange={() => handleOptimisticCategoryChange(parent.slug || parent.id)}
                        className="ltr:mr-2 rtl:ml-2 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <label
                        htmlFor={`category-${parent.id}`}
                        className="text-sm cursor-pointer text-foreground/90 dark:text-foreground/80"
                      >
                        {currentLanguage === 'ar' ? parent.nameAr : parent.nameEn}
                      </label>
                    </div>
                  );
                }

                return (
                  <AccordionItem value={parent.id} key={parent.id}>
                    <AccordionTrigger className="text-sm font-medium hover:no-underline p-3 hover:bg-accent/50 rounded-md text-foreground">
                      {currentLanguage === 'ar' ? parent.nameAr : parent.nameEn}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 ltr:pl-4 rtl:pr-4">
                        {subCategories.map((category) => (
                          <div key={category.id} className="flex items-center">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={optimisticCategories.includes(category.slug || category.id)}
                              onCheckedChange={() => handleOptimisticCategoryChange(category.slug || category.id)}
                              className="ltr:mr-2 rtl:ml-2 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="text-sm cursor-pointer text-foreground/90 dark:text-foreground/80"
                            >
                              {currentLanguage === 'ar' ? category.nameAr : category.nameEn}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              });
            })()
          }
        </Accordion>
      </div>

      {/* Category-specific Specs */}
      {selectedCategories.length === 1 && selectedCategoryObj?.specs?.length > 0 && (
        <div>
          <h3 className="font-bold text-lg mb-3 text-foreground">{t('common.specifications')}</h3>
          {selectedCategoryObj.specs.map((spec, i) => (
            <div key={`${spec.nameEn}-${i}`} className="mb-4"> 
              <div className="font-medium mb-2"> 
                {currentLanguage === 'ar' ? spec.nameAr : spec.nameEn}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2"> 
                {spec.options.map((option, j) => (
                  <div key={`${option}-${j}`} className="flex items-center"> 
                    <Checkbox
                      id={`spec-${spec.nameEn}-option-${j}`} 
                      checked={optimisticSpecs[spec.nameEn]?.includes(option) || false}
                      onCheckedChange={() => handleOptimisticSpecChange(spec.nameEn, option)}
                      className="border-border ltr:mr-2 rtl:ml-2" 
                    />
                    <label htmlFor={`spec-${spec.nameEn}-option-${j}`} className="text-sm cursor-pointer">
                      {option} 
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Brands */}
      <div>
        <h3 className="font-bold text-lg mb-3 text-foreground">{t('common.brands')}</h3>
        {(!initialBrands || initialBrands.length === 0) && !loading && !productsError && (
            <p className="text-sm text-muted-foreground">{t('common.noBrandsAvailable')}</p>
        )}
        {initialBrands && initialBrands.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30">
            {initialBrands.map((brand) => ( // Use initialBrands for rendering options
                <div key={brand.id} className="flex items-center">
                <Checkbox
                    id={`brand-${brand.id}`}
                    checked={optimisticBrands.includes(brand.name)}
                    onCheckedChange={() => handleOptimisticBrandChange(brand.name)}
                    className="ltr:mr-2 rtl:ml-2 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <label
                    htmlFor={`brand-${brand.id}`}
                    className="text-sm cursor-pointer text-foreground/90 dark:text-foreground/80"
                >
                    {brand.name}
                </label>
                </div>
            ))}
            </div>
        )}
      </div>

      {/* Price Slider */}
      <div>
        <h3 className="font-bold text-lg mb-3 text-foreground">{t('common.price')}</h3>
        <Slider
          value={priceRange}
          max={5000000}
          step={10000}
          onValueChange={handlePriceRangeChange} // Updates local state for UI
          onValueCommit={handlePriceRangeCommit} // Updates URL on release
          className="my-6"
          dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString()} {t('common.currency')}</span>
          <span>{priceRange[1].toLocaleString()} {t('common.currency')}</span>
        </div>
      </div>

      {/* In Stock Checkbox */}
      <div>
        <div className="flex items-center">
          <Checkbox
            id="in-stock"
            checked={optimisticInStock}
            onCheckedChange={(checked) => handleOptimisticInStockChange(Boolean(checked))}
            className="ltr:mr-2 rtl:ml-2 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <label htmlFor="in-stock" className="text-sm cursor-pointer text-foreground/90 dark:text-foreground/80">
            {t('common.inStockOnly')}
          </label>
        </div>
      </div>

      {/* Reset Button */}
      <Button onClick={resetFilters} variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">
        {t('common.resetFilters')}
      </Button>
    </div>
  );
};

export default FilterSidebar;