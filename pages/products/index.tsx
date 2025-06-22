import { useEffect, useState } from "react";
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring'; // Import for router.query type
import { useTranslation } from 'react-i18next';
import { Product } from "@/types";
import { Filter, SlidersHorizontal, List, LayoutGrid, X } from "lucide-react";
import dynamic from 'next/dynamic';

const Sheet = dynamic(() => import('@/components/ui/sheet').then(mod => mod.Sheet), { ssr: false });
const SheetContent = dynamic(() => import('@/components/ui/sheet').then(mod => mod.SheetContent), { ssr: false });
const SheetHeader = dynamic(() => import('@/components/ui/sheet').then(mod => mod.SheetHeader), { ssr: false });
const SheetTitle = dynamic(() => import('@/components/ui/sheet').then(mod => mod.SheetTitle), { ssr: false });
const SheetTrigger = dynamic(() => import('@/components/ui/sheet').then(mod => mod.SheetTrigger), { ssr: false });
const SheetClose = dynamic(() => import('@/components/ui/sheet').then(mod => mod.SheetClose), { ssr: false });
const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
const FilterSidebar = dynamic(() => import('@/components/products/FilterSidebar'), { ssr: false });
import { useCategories } from "@/contexts/CategoryContext";
import { fetchProductsWithFilters, fetchBrands, Brand } from "@/services/products";
import { t } from "i18next";

const ProductGrid = dynamic(() => import('@/components/ProductGrid'), { ssr: false });
const Checkbox = dynamic(() => import('@/components/ui/checkbox').then(mod => mod.Checkbox), { ssr: false });
const Slider = dynamic(() => import('@/components/ui/slider').then(mod => mod.Slider), { ssr: false });
const Pagination = dynamic(() => import('@/components/ui/pagination').then(mod => mod.Pagination), { ssr: false });
const PaginationContent = dynamic(() => import('@/components/ui/pagination').then(mod => mod.PaginationContent), { ssr: false });
const PaginationEllipsis = dynamic(() => import('@/components/ui/pagination').then(mod => mod.PaginationEllipsis), { ssr: false });
const PaginationItem = dynamic(() => import('@/components/ui/pagination').then(mod => mod.PaginationItem), { ssr: false });
const PaginationLink = dynamic(() => import('@/components/ui/pagination').then(mod => mod.PaginationLink), { ssr: false });
const PaginationNext = dynamic(() => import('@/components/ui/pagination').then(mod => mod.PaginationNext), { ssr: false });
const PaginationPrevious = dynamic(() => import('@/components/ui/pagination').then(mod => mod.PaginationPrevious), { ssr: false });


interface ProductsPageProps {
  initialProducts: Product[];
  initialBrands: Brand[];
  initialFilters: {
    category?: string[] | null;
    search?: string | null;
    brands?: string[] | null;
    priceMin?: number | null;
    priceMax?: number | null;
    inStock?: boolean | null;
    sortBy?: string | null;
    specs?: { [specName: string]: string[] } | null;
    page?: number; // For pagination state in filters object if needed
  };
  error?: string | null;
  currentPage: number; // Now required
  totalPages: number;   // Now required
  totalProducts: number; // Now required
}

const ProductsPage = ({
  initialProducts,
  initialBrands,
  initialFilters,
  error: serverError,
  currentPage: initialCurrentPage,
  totalPages: initialTotalPages,
  totalProducts: initialTotalProducts
}: ProductsPageProps) => {
  const { t, i18n } = useTranslation();
  const { categories } = useCategories();
  const router = useRouter();

  // --- State Definitions ---
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts || []);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters?.category || []);
  const [searchTerm, setSearchTerm] = useState<string | null>(initialFilters?.search || null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialFilters?.brands || []);
  const [priceRange, setPriceRange] = useState<[number, number]>([initialFilters?.priceMin || 0, initialFilters?.priceMax || 5000000]);
  const [inStock, setInStock] = useState<boolean>(initialFilters?.inStock || false);
  const [sortBy, setSortBy] = useState<string>(initialFilters?.sortBy || "featured");
  const [selectedSpecs, setSelectedSpecs] = useState<{ [specName: string]: string[] }>(initialFilters?.specs || {});
  const [brands, setBrands] = useState<Brand[]>(initialBrands || []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages);
  const [totalProducts, setTotalProducts] = useState<number>(initialTotalProducts);
  
  // --- Loading and Error States ---
  const [clientSideLoading, setClientSideLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(serverError || null);

  const loading = clientSideLoading || router.isFallback;

  const currentLanguage = i18n.language;

  const selectedCategoryObj =
    selectedCategories.length === 1
      ? categories.find(cat => cat.id === selectedCategories[0] || cat.slug === selectedCategories[0])
      : undefined;

  // --- Effects ---
  useEffect(() => {
    setFilteredProducts(initialProducts || []);
    setBrands(initialBrands || []);
    setSelectedCategories(initialFilters?.category || []);
    setSearchTerm(initialFilters?.search || null);
    setSelectedBrands(initialFilters?.brands || []);
    setPriceRange([initialFilters?.priceMin || 0, initialFilters?.priceMax || 5000000]);
    setInStock(initialFilters?.inStock || false);
    setSortBy(initialFilters?.sortBy || "featured");
    setProductsError(serverError || null);
    setSelectedSpecs(initialFilters?.specs || {});
    // Update pagination state from props
    setCurrentPage(initialCurrentPage);
    setTotalPages(initialTotalPages);
    setTotalProducts(initialTotalProducts);
  }, [
    initialProducts, initialBrands, initialFilters, serverError,
    initialCurrentPage, initialTotalPages, initialTotalProducts
  ]);



  const updateQuery = (newFilters: Partial<typeof initialFilters & { page?: number }>) => {
    const query: ParsedUrlQuery = { ...router.query };

    // Category
    const categoriesToSet = newFilters.category !== undefined ? newFilters.category : selectedCategories;
    if (categoriesToSet && categoriesToSet.length > 0) {
      query.category = categoriesToSet.join(',');
    } else {
      delete query.category;
    }


    // Search term
    if (newFilters.search !== undefined) query.search = newFilters.search;
    else if (searchTerm) query.search = searchTerm;
    if (query.search === null) delete query.search;

    // Brands
    const brandsToSet = newFilters.brands !== undefined ? newFilters.brands : selectedBrands;
    if (brandsToSet && brandsToSet.length > 0) query.brands = brandsToSet.join(',');
    else delete query.brands;

    // Price Range
    const priceMinToSet = newFilters.priceMin !== undefined ? newFilters.priceMin : priceRange[0];
    const priceMaxToSet = newFilters.priceMax !== undefined ? newFilters.priceMax : priceRange[1];
    if (priceMinToSet !== 0 || priceMaxToSet !== 5000000) {
        query.priceMin = priceMinToSet.toString();
        query.priceMax = priceMaxToSet.toString();
    } else {
        delete query.priceMin;
        delete query.priceMax;
    }
    
    // In Stock
    const inStockToSet = newFilters.inStock !== undefined ? newFilters.inStock : inStock;
    if (inStockToSet) query.inStock = 'true';
    else delete query.inStock;

    // Sort By
    const sortByToSet = newFilters.sortBy !== undefined ? newFilters.sortBy : sortBy;
    if (sortByToSet && sortByToSet !== "featured") query.sortBy = sortByToSet;
    else delete query.sortBy;

    // Specs
    const specsToSet = newFilters.specs !== undefined ? newFilters.specs : selectedSpecs;
    if (specsToSet && Object.keys(specsToSet).length > 0) {
      query.specs = JSON.stringify(specsToSet);
    } else {
      delete query.specs;
    }
    
    // Page
    if (newFilters.page !== undefined) {
      if (newFilters.page > 1) query.page = newFilters.page.toString();
      else delete query.page; // Don't include page=1 in URL
    } else if (Object.keys(newFilters).some(key => key !== 'page')) {
      // If other filters are changing, reset to page 1
      delete query.page;
    }
    // If only page is changing, router.query.page would be used if newFilters.page is undefined.
    // This is handled by router.push merging with existing query if not explicitly deleted.

    router.push({ pathname: router.pathname, query });
  };


  const handleBrandChange = (brandName: string) => {
    const newSelectedBrands = selectedBrands.includes(brandName)
      ? selectedBrands.filter((b) => b !== brandName)
      : [...selectedBrands, brandName];
    // setSelectedBrands(newSelectedBrands); // State update will come from props
    updateQuery({ brands: newSelectedBrands });
  };

  const handleCategoryChange = (categoryIdentifier: string) => {
    const newSelectedCategories = selectedCategories.includes(categoryIdentifier)
      ? selectedCategories.filter((c) => c !== categoryIdentifier)
      : [...selectedCategories, categoryIdentifier];
    // Reset specs when category selection changes, as they might not be relevant.
    updateQuery({ category: newSelectedCategories, specs: {} });
  };

  const handleSpecChange = (specName: string, option: string) => {
    const prevOptions = selectedSpecs[specName] || [];
    const isSelected = prevOptions.includes(option);
    const newOptions = isSelected
      ? prevOptions.filter((o) => o !== option)
      : [...prevOptions, option];
    
    const newSpecs = { ...selectedSpecs };
    if (newOptions.length === 0) {
      delete newSpecs[specName];
    } else {
      newSpecs[specName] = newOptions;
    }
    // setSelectedSpecs(newSpecs); // State update from props
    updateQuery({ specs: newSpecs });
  };

  const handlePriceRangeChange = (newRange: [number, number]) => {
    setPriceRange(newRange); // Update local state for slider responsiveness
  };

  const handlePriceRangeCommit = (finalRange: [number, number]) => {
    updateQuery({ priceMin: finalRange[0], priceMax: finalRange[1] });
  };

  const handleInStockChange = (checked: boolean) => {
    // setInStock(checked); // State update from props
    updateQuery({ inStock: checked });
  };

  const handleSortByChange = (newSortBy: string) => {
    updateQuery({ sortBy: newSortBy });
  };

  const handlePageChange = (newPage: number) => {
    // setCurrentPage(newPage); // State will be updated by props after router.push
    updateQuery({ page: newPage });
  };

  const resetFilters = () => {
    router.push({ pathname: router.pathname, query: {} }); // This will trigger SSR with no filters
    // Client-side states will be reset by the useEffect watching for prop changes.
    // No need to manually reset them here if relying on SSR as source of truth.
    setIsSheetOpen(false);
  };



  // --- JSX Return ---
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
        {t('productsPage.title')}
      </h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters - Desktop */}
        <aside className="hidden md:block w-64 space-y-8 flex-shrink-0">
          <FilterSidebar
            selectedCategories={selectedCategories}
            selectedBrands={selectedBrands}
            priceRange={priceRange}
            inStock={inStock}
            selectedSpecs={selectedSpecs}
            initialBrands={initialBrands}
            loading={loading}
            productsError={productsError}
            handleBrandChange={handleBrandChange}
            handleCategoryChange={handleCategoryChange}
            handleSpecChange={handleSpecChange}
            handlePriceRangeChange={handlePriceRangeChange}
            handlePriceRangeCommit={handlePriceRangeCommit}
            handleInStockChange={handleInStockChange}
            resetFilters={resetFilters}
            currentLanguage={currentLanguage}
            selectedCategoryObj={selectedCategoryObj}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-border pb-4">
             {/* Left side: Count, View Toggle, Mobile Filter */}
            <div className="flex items-center gap-4">
               {!loading && !productsError && (
                 <p className="text-muted-foreground text-sm">
                   {t('common.foundProducts', { count: filteredProducts.length })}
                 </p>
               )}
               {/* Loading state from SSR is handled by router.isFallback or a general loading prop */}
               {loading && !serverError && ( // Show client-side loading if applicable
                  <p className="text-muted-foreground text-sm animate-pulse">{t('common.loading')}...</p>
               )}
               {serverError && (
                  <p className="text-muted-foreground text-sm ">{t('errors.errorOccurred')}</p>
               )}

              {/* View Mode Toggle */}
              <div className="flex items-center border border-border rounded-md p-1 bg-muted/50 dark:bg-muted/20">
                <button
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-background dark:bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('grid')}
                  aria-label={t('common.gridView')}
                  disabled={loading} 
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-background dark:bg-accent text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('list')}
                  aria-label={t('common.listView')}
                  disabled={loading} 
                >
                  <List size={18} />
                </button>
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="md:hidden" disabled={loading}>
                    <Filter size={16} className="ltr:mr-2 rtl:ml-2" />
                    {t('common.filter')}
                  </Button>
                </SheetTrigger>
                <SheetContent side={currentLanguage === 'ar' ? 'right' : 'left'} className="overflow-y-auto w-[300px] bg-background p-0">
                    <SheetHeader className="flex flex-row justify-between items-center p-4 border-b border-border">
                      <SheetTitle className="text-lg font-semibold text-foreground">{t('common.filterProducts')}</SheetTitle>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon">
                          <X className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </SheetClose>
                    </SheetHeader>
                    <div className="p-4">
                      <FilterSidebar
                        selectedCategories={selectedCategories}
                        selectedBrands={selectedBrands}
                        priceRange={priceRange}
                        inStock={inStock}
                        selectedSpecs={selectedSpecs}
                        initialBrands={initialBrands}
                        loading={loading}
                        productsError={productsError}
                        handleBrandChange={handleBrandChange}
                        handleCategoryChange={handleCategoryChange}
                        handleSpecChange={handleSpecChange}
                        handlePriceRangeChange={handlePriceRangeChange}
                        handlePriceRangeCommit={handlePriceRangeCommit}
                        handleInStockChange={handleInStockChange}
                        resetFilters={resetFilters}
                        currentLanguage={currentLanguage}
                        selectedCategoryObj={selectedCategoryObj}
                      />
                    </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Right side: Sorting */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('common.sortBy')}</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortByChange(e.target.value)}
                className="border border-input rounded-md p-2 text-sm bg-background text-foreground focus:ring-ring focus:ring-1 focus:outline-none"
                aria-label={t('common.sortBy')}
                disabled={loading} 
              >
                <option value="featured">{t('common.featured')}</option>
                <option value="price-asc">{t('common.priceAsc')}</option>
                <option value="price-desc">{t('common.priceDesc')}</option>
                <option value="newest">{t('common.newest')}</option>
              </select>
            </div>
          </div>

          {/* --- Conditional Rendering --- */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : productsError ? (
             <div className="text-center py-12 text-destructive">
               <SlidersHorizontal className="mx-auto h-12 w-12 mb-4" /> 
               <h3 className="text-xl font-medium mb-2">
                 {t('errors.errorOccurred')}
               </h3>
               <p className="mb-4 max-w-sm mx-auto">
                 {productsError} 
               </p>
               <Button onClick={resetFilters} variant="outline">
                 {t('common.tryAgain')} 
               </Button>
             </div>
          ) : filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} viewMode={viewMode} />
          ) : (
            <div className="text-center py-12">
              <SlidersHorizontal className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2 text-foreground">
                {t('common.noProductsFound')}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
                {t('common.noProductsFoundDesc')}
              </p>
              <Button onClick={resetFilters} variant="outline" className="border-primary text-primary hover:bg-primary/10">
                {t('common.resetFilters')}
              </Button>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalPages > 1 && !loading && !productsError && (
            <div className="mt-12 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#" // Handled by onClick
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : undefined}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {/* Generate page numbers with ellipsis */}
                  {(() => {
                    const pageLinks = [];
                    const wingSize = 1; // Number of pages to show around current page, and at start/end
                    const showEllipsisThreshold = 3 + (wingSize * 2); // When to start showing ellipsis

                    if (totalPages <= showEllipsisThreshold) { // Show all pages if not too many
                      for (let i = 1; i <= totalPages; i++) {
                        pageLinks.push(
                          <PaginationItem key={i}>
                            <PaginationLink
                              href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
                              isActive={currentPage === i}
                            >
                              {i}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                    } else {
                      // First page
                      pageLinks.push(
                        <PaginationItem key={1}>
                          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }} isActive={currentPage === 1}>1</PaginationLink>
                        </PaginationItem>
                      );

                      // Ellipsis or pages after first
                      if (currentPage > wingSize + 2) {
                        pageLinks.push(<PaginationEllipsis key="ellipsis-start" />);
                      } else if (currentPage === wingSize + 2) {
                         pageLinks.push(
                          <PaginationItem key={2}>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(2); }} isActive={currentPage === 2}>2</PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      // Pages around current
                      const startPage = Math.max(2, currentPage - wingSize);
                      const endPage = Math.min(totalPages - 1, currentPage + wingSize);
                      for (let i = startPage; i <= endPage; i++) {
                        if (i > 1 && i < totalPages) { // Avoid duplicating first/last page if they fall in this range
                           pageLinks.push(
                            <PaginationItem key={i}>
                              <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(i); }} isActive={currentPage === i}>{i}</PaginationLink>
                            </PaginationItem>
                          );
                        }
                      }

                      // Ellipsis or pages before last
                      if (currentPage < totalPages - (wingSize + 1)) {
                        pageLinks.push(<PaginationEllipsis key="ellipsis-end" />);
                      } else if (currentPage === totalPages - (wingSize + 1) && totalPages > wingSize +1) {
                         pageLinks.push(
                          <PaginationItem key={totalPages -1}>
                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages -1); }} isActive={currentPage === totalPages -1}>{totalPages -1}</PaginationLink>
                          </PaginationItem>
                        );
                      }

                      // Last page
                      pageLinks.push(
                        <PaginationItem key={totalPages}>
                          <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }} isActive={currentPage === totalPages}>{totalPages}</PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return pageLinks;
                  })()}

                  <PaginationItem>
                    <PaginationNext
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : undefined}
                      aria-disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;

  // Parse and validate filters from query parameters
  const initialFilters: ProductsPageProps['initialFilters'] = {
    category: query.category ? (query.category as string).split(',') : [],
    search: (query.search as string) || null,
    brands: query.brands ? (query.brands as string).split(',') : [],
    priceMin: query.priceMin && !isNaN(parseInt(query.priceMin as string)) ? parseInt(query.priceMin as string, 10) : 0,
    priceMax: query.priceMax && !isNaN(parseInt(query.priceMax as string)) ? parseInt(query.priceMax as string, 10) : 5000000,
    inStock: query.inStock === 'true',
    sortBy: (query.sortBy as string) || "featured",
    specs: {}, // Will be populated safely below
    page: query.page && !isNaN(parseInt(query.page as string)) ? parseInt(query.page as string, 10) : 1,
  };

  if (typeof query.specs === 'string') {
    try {
      initialFilters.specs = JSON.parse(query.specs);
    } catch (e) {
      console.error("Invalid JSON for specs query param:", query.specs);
      // Keep specs as {}
    }
  }

  const limitNum = 20; // Define products per page

  try {
    const [productsResult, brandsData] = await Promise.all([
      fetchProductsWithFilters({
        categoryIds: initialFilters.category,
        brandNames: initialFilters.brands,
        priceMin: initialFilters.priceMin,
        priceMax: initialFilters.priceMax,
        inStock: initialFilters.inStock,
        searchTerm: initialFilters.search,
        sortBy: initialFilters.sortBy,
        specs: initialFilters.specs,
        page: initialFilters.page,
        limit: limitNum,
      }),
      fetchBrands()
    ]);
    
    return {
      props: {
        initialProducts: productsResult.products,
        initialBrands: brandsData,
        initialFilters,
        error: null,
        currentPage: productsResult.currentPage,
        totalPages: productsResult.totalPages,
        totalProducts: productsResult.totalProducts,
      },
    };
  } catch (error) {
    console.error('Failed to fetch products/brands in getServerSideProps:', error);
    return {
      props: {
        initialProducts: [],
        initialBrands: [],
        initialFilters, // Return the filters that were attempted
        error: t("errors.noproducts"),
        currentPage: 1,
        totalPages: 0,
        totalProducts: 0,
      },
    };
  }
};

export default ProductsPage;