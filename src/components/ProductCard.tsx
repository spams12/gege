import Link from "next/link";
import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react"; // Removed unused Star
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  listView?: boolean; // Re-enabled listView prop for controlling layout
}

const ProductCard = ({ product, listView = false }: ProductCardProps) => {
  const { t, i18n } = useTranslation();
  const { addToCart } = useCart();
  const currentLanguage = i18n.language;

  const productName = product.name;
  // Bring back description logic for list view
  const productDescription = product.description;
  
  // Check if the product name is short (less than 15 characters)
  const isShortName = productName.length < 15;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(t('common.addToCartSuccess', { productName }));
  };

  // Base card classes - Keep consistent
  const cardBaseClass = "group bg-card text-card-foreground rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 flex border border-border";

  // *** Reintroduce Conditional Layout based on listView ***
  const cardLayoutClass = listView
    ? "flex-row items-start" // List view: horizontal layout
    : "flex-col h-full";     // Grid view: vertical layout, full height

  // *** Reintroduce Conditional Image Container based on listView ***
  const imageContainerClass = listView
    ? "w-24 h-24 sm:w-32 md:w-40 flex-shrink-0 relative overflow-hidden bg-muted/20" // Fixed size for list view
    : "w-full aspect-square relative overflow-hidden flex-shrink-0 bg-muted/20";   // Aspect ratio for grid view

  // Image styling - Keep consistent hover effect for grid view
  const imageClass = "w-full h-full object-contain transition-transform duration-300";
  const imageHoverClass = !listView ? "group-hover:scale-105" : "";

  // Content container - Keep consistent padding, allow flex grow
  const contentContainerClass = "p-3 sm:p-4 flex flex-col flex-1 overflow-hidden"; // Added overflow-hidden

  // *** Reintroduce Conditional Price/Button Alignment ***
  // Use flex-end for list view button, space-between for grid view
  const priceButtonSectionClass = `mt-auto flex items-center gap-2 ${listView ? 'justify-end' : 'justify-between'}`; // mt-auto pushes to bottom

  return (
    <Link
      href={`/products/${product.slug}`}
      // Apply conditional layout class
      className={`${cardBaseClass} ${cardLayoutClass}`}
      aria-label={`View details for ${productName}`}
    >
      {/* Image Section */}
      <div className={imageContainerClass}>
        <img
          src={product?.mainImage || product.images[0] ||'/placeholder.svg'}
          alt={productName}
          // Apply conditional hover class
          className={`${imageClass} ${imageHoverClass}`}
          loading="lazy"
        />
        {/* Badges - Keep consistent */}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-1.5 py-0.5">
                {t('common.new')}
            </Badge>
          )}
           {product.discountPrice && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              {t('common.discount', { percent: Math.round(((product.price - product.discountPrice) / product.price) * 100) })}%
            </Badge>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className={contentContainerClass}>
        {/* Top part of content: Title and potentially Description */}
        {/* Use flex-1 in grid view to push bottom section down */}
        <div className={`${!listView ? 'flex-1' : ''} mb-2`}>
          <h3
            className={`font-semibold text-card-foreground mb-0.5 sm:mb-1 ${
              // Adjust text size based on view
              listView ? 'text-sm sm:text-base md:text-lg' : 'text-sm md:text-base'
            } leading-tight group-hover:text-primary transition-colors line-clamp-3`}
            title={productName}
          >
            {productName}
          </h3>

          {/* Show brand name when product name is short or in list view */}
          {(isShortName || listView) && product.brand && (
            <span className="text-xs text-muted-foreground">{product.brand.name}</span>
          )}

          {/* *** Reintroduce Description for List View Only *** */}
          {listView && productDescription && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 line-clamp-2 sm:line-clamp-3">
              {productDescription}
            </p>
          )}
        </div>

        {/* Bottom Section: Price & Add to Cart */}
        {/* Apply conditional alignment class */}
        <div className={`${priceButtonSectionClass}`}>
          {/* Price - Keep consistent styling */}
          <div className={`font-bold ${listView ? 'text-sm sm:text-base' : 'text-base'} text-foreground`}>
            {product.discountPrice ? (
              <div className="flex flex-col items-start">
                <span className="text-primary">
                  {product.discountPrice.toLocaleString()} {t('common.currency')}
                </span>
                <span className="text-muted-foreground line-through text-xs">
                  {product.price.toLocaleString()} {t('common.currency')}
                </span>
              </div>
            ) : (
              <span className="text-blue-600">
                {product.price.toLocaleString()} {t('common.currency')}
              </span>
            )}
          </div>

          {/* Add to Cart Button - Keep new styling & responsive hiding */}
          <Button
            size="icon"
            variant="ghost"
            className={`
              shrink-0 rounded-full text-muted-foreground hover:bg-muted/50 hover:text-primary
              hidden sm:inline-flex /* Hide below 'sm' breakpoint */
              ${listView ? 'ms-4' : ''} /* Add some margin start in list view */
            `}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            aria-label={t('productCard.addToCartLabel', { productName })}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;