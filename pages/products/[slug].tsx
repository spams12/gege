import React, { useState, useEffect } from 'react'; // A0: Added React imports
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Image from 'next/image'; // A2: Added next/image import
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { Product } from "@/types";
import { fetchAllProducts, fetchProductBySlug } from "@/services/products";
import dynamic from 'next/dynamic';

const Tabs = dynamic(() => import('@/components/ui/tabs').then(mod => mod.Tabs), { ssr: false });
const TabsContent = dynamic(() => import('@/components/ui/tabs').then(mod => mod.TabsContent), { ssr: false });
const TabsList = dynamic(() => import('@/components/ui/tabs').then(mod => mod.TabsList), { ssr: false });
const TabsTrigger = dynamic(() => import('@/components/ui/tabs').then(mod => mod.TabsTrigger), { ssr: false });
const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
const ShoppingCart = dynamic(() => import('lucide-react').then(mod => mod.ShoppingCart), { ssr: false });
const Heart = dynamic(() => import('lucide-react').then(mod => mod.Heart), { ssr: false });
const Share2 = dynamic(() => import('lucide-react').then(mod => mod.Share2), { ssr: false });
const AlertCircle = dynamic(() => import('lucide-react').then(mod => mod.AlertCircle), { ssr: false });
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "sonner";

// Helper to get localized category name
// Helper to get localized category name (no longer needs 't' as it's already localized)
const getLocalizedCategoryName = (categoryName: string): string => {
    // The categoryName is already localized (nameEn or nameAr from Firebase)
    // No further translation needed here.
    return categoryName;
};

interface ProductDetailPageProps {
  product: Product | null;
}

const ProductDetailPage = ({ product: initialProduct }: ProductDetailPageProps) => {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  // const { id } = router.query; // Product ID is now from props

  // Product state is now managed by props, no need for useState for product itself or loading state
  const [product, setProduct] = useState<Product | null>(initialProduct); // Initialize with prop
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  // const [loading, setLoading] = useState(true); // Removed, data comes from getServerSideProps
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const currentLanguage = i18n.language;

  // useEffect to update product if initialProduct changes (e.g., due to client-side navigation updates if any)
  // For typical getServerSideProps usage, this might not be strictly necessary if the page always re-fetches on navigation.
  // However, keeping it can handle scenarios where props might update.
  useEffect(() => {
    setProduct(initialProduct);
    if (initialProduct) { // Reset quantity and image index when product changes
        setQuantity(1);
        setActiveImageIndex(0);
    }
    window.scrollTo(0, 0);
  }, [initialProduct]);


  const handleQuantityChange = (newQuantity: number) => {
    if (product && newQuantity > 0 && newQuantity <= product.stock) { // A4: Refined quantity check
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleWishlistToggle = () => {
    if (product) {
      if (isInWishlist(product.id)) {
        removeFromWishlist(product.id);
      } else {
        addToWishlist(product);
      }
    }
  };

  const handleShare = async () => {
    if (!product) return;

    const shareUrl = window.location.href;

    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: getLocalized('name'),
          text: getLocalized('description').substring(0, 100) + '...',
          url: shareUrl,
        });
        toast.success(t('wishlist.shareSuccess'));
      } catch (error) {
        console.error('Share API error:', error);
        // Don't show an error toast if the user cancels the share dialog
      }
    } else if (navigator.clipboard && window.isSecureContext) {
      // Fallback to clipboard API in secure contexts (HTTPS or localhost)
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('wishlist.shareSuccess'));
      } catch (error) {
        console.error('Clipboard API error:', error);
        toast.error(t('wishlist.shareFailure'));
      }
    } else {
      // Final fallback for insecure contexts (HTTP) or old browsers
      toast.error(t('wishlist.shareFailure'));
    }
  };

  // Helper to get localized product property, ensuring string output
  const getLocalized = (prop: keyof Product): string => {
    if (!product) return '';
    const keyAr = `${prop}Ar` as keyof Product; // e.g., nameAr, descriptionAr
    const value = currentLanguage === 'ar' && product[keyAr] ? product[keyAr] : product[prop];
    // Explicitly convert to string and handle potential null/undefined
    return String(value ?? '');
  }

  const getLocalizedSpecs = (): { [key: string]: string | number | boolean } => { // A5: Ensure return type consistency
    if (!product) return {};
    if (currentLanguage === 'ar' && product.specificationsAr) {
      return product.specificationsAr ?? {};
    }
    return product.specifications ?? {};
  }

  const getLocalizedFeatures = (): string[] => {
    if (!product) return [];
    if (currentLanguage === 'ar' && product.featuresAr) {
      return product.featuresAr ?? [];
    }
    return product.features ?? [];
  }

  // Loading state is handled by Next.js router during getServerSideProps
  // The component will only render once data (or notFound) is resolved.

  if (!product) { // This handles the case where getServerSideProps returns notFound or an error leading to product being null
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          {t('productDetailPage.productNotFound')}
        </h1>
        <p className="mb-8 text-muted-foreground">
          {t('productDetailPage.productNotFoundDesc')}
        </p>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/products">{t('productDetailPage.backToProducts')}</Link> {/* Changed to NextLink */}
        </Button>
      </div>
    );
  }

  // Check if this product is in the wishlist
  const productInWishlist = isInWishlist(product.id);

  return (
    <div className="container mx-auto px-4 py-8 text-foreground">
      <Head>
        <title>{`${getLocalized('name')} - ${product.discountPrice ? product.discountPrice.toLocaleString() : product.price.toLocaleString()} ${t('common.currency')} | Qabas Tech Store`}</title>
        <meta name="description" content={getLocalized('description')} />
      </Head>

      {/* Breadcrumb */}
      <div className="flex items-center mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary"> {/* Changed to NextLink */}
          {t('productDetailPage.homeBreadcrumb')}
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-primary"> {/* Changed to NextLink */}
          {t('productDetailPage.productsBreadcrumb')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-primary font-medium">{getLocalized('name')}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* Product Images */}
        <div className="lg:w-1/2">
          <div className="relative w-full aspect-square bg-card rounded-lg overflow-hidden shadow-md mb-4 border border-border"> {/* A2: Added relative for NextImage layout fill */}
            <Image
              src={product.images[activeImageIndex] || '/placeholder.svg'}
              alt={getLocalized('name')} /* A6: Removed redundant 'as string' */
              layout="fill"
              objectFit="contain"
              priority={true} // A2: Mark main image as priority
            />
          </div>
          <div className="flex gap-2">
            {product.images.map((image, index) => (
              <div
                key={index}
                className={`cursor-pointer border-2 rounded-md overflow-hidden ${
                  index === activeImageIndex
                    ? "border-primary"
                    : "border-border hover:border-muted-foreground/50"
                }`}
                onClick={() => setActiveImageIndex(index)}
              >
                <Image
                  src={image || '/placeholder.svg'}
                  alt={`${getLocalized('name')} thumbnail ${index + 1}`} // A3: Improved thumbnail alt text
                  width={64}
                  height={64}
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div  className="lg:w-1/2">
          <div className="flex flex-col">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-foreground">{getLocalized('name')}</h1>
              <div className="flex items-center mb-4">
                <div className="flex ltr:mr-2 rtl:ml-2">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? "text-yellow-400 dark:text-yellow-500"
                          : "text-muted-foreground/50"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                       <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <span className="text-muted-foreground">
                  {t('common.rating')} {product.rating} ({t('common.reviews', { count: product.reviews })})
                </span>
              </div>

              <div className="mb-6">
                {product.discountPrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-primary">
                      {product.discountPrice.toLocaleString()} {t('common.currency')}
                    </span>
                    <span className="text-xl text-muted-foreground line-through">
                      {product.price.toLocaleString()} {t('common.currency')}
                    </span>
                    <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-sm font-medium">
                      {t('common.discount', { percent: Math.round(((product.price - product.discountPrice) / product.price) * 100) })}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {product.price.toLocaleString()} {t('common.currency')}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <p className="text-foreground/90 dark:text-foreground/80 leading-relaxed">
                  {getLocalized('description')}
                </p>
              </div>

              <div className="mb-8 space-y-3 text-sm">
                <div className="flex items-center">
                  <div className="w-32 text-muted-foreground">{t('common.brand')}:</div>
                  <div className="font-medium text-foreground">{product.brand.name}</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-muted-foreground">{t('common.stockStatus')}:</div>
                  <div className={`font-medium ${product.stock > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-500"}`}>
                    {product.stock > 0 ? t('common.available') : t('common.outOfStock')}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-muted-foreground">{t('common.category')}:</div>
                  <Link href={`/products?category=${product.category.id}`} className="font-medium text-primary hover:underline"> {/* Changed to NextLink */}
                     {getLocalizedCategoryName(product.category.name)}
                  </Link>
                </div>
              </div>

              {product.stock > 0 && (
                <div className="mb-6">
                  <div className="items-center border border-border rounded-md inline-flex mb-6 bg-background">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="px-4 py-2 text-lg border-e border-border disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-4 py-2 text-lg min-w-[3rem] text-center font-medium">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="px-4 py-2 text-lg border-s border-border disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="ltr:mr-2 rtl:ml-2 h-5 w-5" />
                      {t('common.addToCart')}
                    </Button>
                    <Button
                      variant="outline"
                      className={`${productInWishlist ? 'bg-primary/10 border-primary' : 'border-primary'} text-primary hover:bg-primary/10`}
                      onClick={handleWishlistToggle}
                      title={productInWishlist ? t('common.removeFromWishlist') : t('common.addToWishlist')}
                    >
                      <Heart className={`h-5 w-5 ${productInWishlist ? 'fill-primary' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10"
                      onClick={handleShare}
                      title={t('common.share')}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <Tabs dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'} defaultValue="specs" className="mb-12">
        <TabsList className="w-full border-b border-border justify-start mb-4 rounded-none bg-transparent p-0">
          <TabsTrigger value="specs" className="px-4 py-2 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none text-muted-foreground">
            {t('productDetailPage.specifications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specs" className="p-4 bg-card rounded-md shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-4 text-card-foreground">
            {t('productDetailPage.technicalSpecs')}
          </h2>
          {/* A5: Improved Specifications Display Logic */}
          {product.specs && product.specs.length > 0 ? (
            <div className="divide-y divide-border">
              {product.specs.map((spec, idx) => (
                <div key={idx} className="py-3 flex">
                  <div className="w-1/3 font-medium text-muted-foreground">
                    {currentLanguage === 'ar' && spec.nameAr ? spec.nameAr : spec.nameEn}
                  </div>
                  <div className="w-2/3 text-card-foreground">{String(spec.value ?? '')}</div>
                </div>
              ))}
            </div>
          ) : Object.keys(getLocalizedSpecs()).length > 0 ? (
            <div className="divide-y divide-border">
              {Object.entries(getLocalizedSpecs()).map(([key, value]) => (
                <div key={key} className="py-3 flex">
                  <div className="w-1/3 font-medium text-muted-foreground">{key}</div>
                  <div className="w-2/3 text-card-foreground">
                    {typeof value === "object" ? JSON.stringify(value) : String(value ?? '')}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">{t('productDetailPage.noSpecificationsFound', 'No specifications available for this product.')}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allProducts = await fetchAllProducts();
  const paths = allProducts.map((product) => ({
    params: { slug: product.slug },
  }));

  return {
    paths,
    fallback: 'blocking', // or true, or false
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params || {};



  try {
    const fetchedProduct = await fetchProductBySlug(slug as string);
    if (!fetchedProduct) {
      return { notFound: true };
    }
    return { props: { product: fetchedProduct }, revalidate: 60 }; // Revalidate every 60 seconds
  } catch (error) {
    console.error(`Failed to fetch product with slug ${slug}:`, error);
    return { notFound: true };
  }
};

export default ProductDetailPage;