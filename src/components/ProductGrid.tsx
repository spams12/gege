import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  viewMode?: 'grid' | 'list';
}

const ProductGrid = ({ products, viewMode = 'grid' }: ProductGridProps) => {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-3 sm:gap-4">
        {products.map((product) => (
          <ProductCard key={`${product.id}-list`} product={product} listView />
        ))}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
      {products.map((product) => (
        <ProductCard key={`${product.id}-grid`} product={product} listView={false} />
      ))}
    </div>
  );
};

export default ProductGrid;