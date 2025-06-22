import Link from 'next/link'; // Changed from react-router-dom
import { useRouter } from 'next/router'; // Changed from react-router-dom
import { useTranslation } from 'react-i18next'; // Import useTranslation
const ShoppingCartIcon = dynamic(() => import('lucide-react').then(mod => mod.ShoppingCart), { ssr: false });
const Trash2Icon = dynamic(() => import('lucide-react').then(mod => mod.Trash2), { ssr: false });
const ChevronLeftIcon = dynamic(() => import('lucide-react').then(mod => mod.ChevronLeft), { ssr: false });
const ChevronRightIcon = dynamic(() => import('lucide-react').then(mod => mod.ChevronRight), { ssr: false });
const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import dynamic from 'next/dynamic';

const Input = dynamic(() => import('@/components/ui/input').then(mod => mod.Input), { ssr: false });

const CartPage = () => {
  const { t, i18n } = useTranslation(); // Get translation
  const { cartItems, removeFromCart, updateQuantity, getCartTotal, shippingCost } = useCart();
  const router = useRouter(); // Changed from useNavigate
  const currentLanguage = i18n.language;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    // Find the item to check stock before updating
    const item = cartItems.find(i => i.product.id === productId);
    if (newQuantity > 0 && item && newQuantity <= item.product.stock) {
      updateQuantity(productId, newQuantity);
    } else if (item && newQuantity > item.product.stock) {
        // Optionally notify user they reached max stock
        toast.warning(`Maximum stock (${item.product.stock}) reached for ${currentLanguage === 'ar' ? item.product.nameAr : item.product.name}`);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
    toast.success(t('common.removeFromCartSuccess')); // Use translated message
  };

  // Get localized product name
  const getLocalizedProductName = (item: { product: { name: string; nameAr?: string } }) => {
      return currentLanguage === 'ar' ? (item.product.nameAr || item.product.name) : item.product.name;
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center text-foreground">
          {t('cartPage.title')}
        </h1>
        <div className="text-center py-12 max-w-md mx-auto bg-card dark:bg-card/80 border border-border rounded-lg shadow-sm p-8">
          <ShoppingCartIcon className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
          <h2 className="text-2xl font-medium mb-2 text-foreground">
            {t('cartPage.emptyTitle')}
          </h2>
          <p className="text-muted-foreground mb-8">
            {t('cartPage.emptyDescription')}
          </p>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/products">{t('cartPage.browseProducts')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
        {t('cartPage.title')}
      </h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items Section */}
        <div className="lg:w-2/3">
          <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold text-card-foreground">
                {t('cartPage.products', { count: cartItems.length })}
              </h2>
            </div>
    
            <div className="divide-y divide-border">
              {cartItems.map((item) => (
                <div key={item.product.id} className="p-4 flex flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-muted/30 dark:bg-muted/20 rounded-md flex items-center justify-center overflow-hidden">
                    <img
                      src={item.product.images?.[0] || '/placeholder.svg'}
                      alt={getLocalizedProductName(item)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Details & Actions */}
                  <div className="flex-1 flex flex-col justify-between gap-2 sm:gap-0">
                    <div>
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-semibold text-card-foreground hover:text-primary text-base line-clamp-2"
                      >
                        {getLocalizedProductName(item)}
                      </Link>
                      <div className="text-sm text-muted-foreground mt-1">
                         {t('common.brand')}: {item.product.brand?.name || t('common.unavailable', 'N/A')}
                      </div>
                    </div>
                    {/* Price, Quantity, Remove */}
                    <div className="flex justify-between items-center mt-2 sm:mt-0">
                       <div className="font-bold text-lg text-primary">
                         {/* Calculate item total price */}
                         {((item.product.discountPrice || item.product.price) * item.quantity).toLocaleString()} {t('common.currency')}
                       </div>
                       <div className="flex items-center gap-4">
                         {/* Quantity Input */}
                         <div className="flex items-center border border-input rounded-md">
                           <button
                             onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                             className="px-3 py-1 text-sm border-e border-input text-muted-foreground hover:text-foreground disabled:opacity-50"
                             disabled={item.quantity <= 1} // Disable minus button at 1
                             aria-label={t('cartPage.decreaseQuantity', 'Decrease quantity')}
                           >
                             -
                           </button>
                           <span className="px-3 py-1 text-sm min-w-[2.5rem] text-center font-medium text-foreground">
                             {item.quantity}
                           </span>
                           <button
                             onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                             className="px-3 py-1 text-sm border-s border-input text-muted-foreground hover:text-foreground disabled:opacity-50"
                             disabled={item.quantity >= item.product.stock}
                             aria-label={t('cartPage.increaseQuantity', 'Increase quantity')}
                           >
                             +
                           </button>
                         </div>
                         {/* Remove Button */}
                         <button
                           onClick={() => handleRemoveItem(item.product.id)}
                           className="text-destructive hover:text-destructive/80"
                           aria-label={t('common.delete')}
                         >
                           <Trash2Icon size={18} />
                         </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Shopping Link */}
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center text-primary hover:underline"
            >
              {currentLanguage === 'ar' ? <ChevronRightIcon className="rtl:mr-1 h-4 w-4" /> : <ChevronLeftIcon className="ltr:mr-1 h-4 w-4" />}
              {t('cartPage.continueShopping')}
            </Link>
          </div>
        </div>

        {/* Order Summary Section */}
        <div className="lg:w-1/3">
          <div className="bg-card rounded-lg shadow-md p-6 border border-border sticky top-24"> {/* Made sticky */}
            <h2 className="text-xl font-bold mb-4 text-card-foreground">
              {t('cartPage.orderSummary')}
            </h2>
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between border-b border-border pb-3 text-muted-foreground">
                <span>{t('cartPage.subtotal')}</span>
                <span className="text-card-foreground">{getCartTotal().toLocaleString()} {t('common.currency')}</span>
              </div>
              {/* Shipping */}
              <div className="flex justify-between border-b border-border pb-3 text-muted-foreground">
                <span>{t('cartPage.shipping')}</span>
                <span className="text-card-foreground">{shippingCost.toLocaleString()} {t('common.currency')}</span>
              </div>
              {/* Total */}
              <div className="flex justify-between font-bold text-lg text-card-foreground pt-2">
                <span>{t('cartPage.total')}</span>
                <span>{(getCartTotal() + shippingCost).toLocaleString()} {t('common.currency')}</span>
              </div>

              {/* Coupon Code - Optional */}
              <div className="pt-4 border-t border-border">
                <div className="mb-4">
                   <label htmlFor="coupon-code" className="text-sm text-muted-foreground block mb-2">
                      {t('cartPage.haveCoupon')}
                   </label>
                  <div className="flex">
                    <Input
                      id="coupon-code"
                      type="text"
                      placeholder={t('cartPage.enterCoupon')}
                      className="rounded-e-none border-input bg-background focus:border-primary focus:ring-0" // Adjusted styles
                      disabled
                    />
                    <Button className="rounded-s-none bg-primary/10 text-primary hover:bg-primary/20 border border-primary border-s-0" disabled>
                      {t('cartPage.apply')}
                    </Button>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
                  onClick={() => router.push('/checkout')} // Changed from navigate
                  disabled={cartItems.length === 0} 
                >
                  {t('cartPage.proceedToCheckout')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;