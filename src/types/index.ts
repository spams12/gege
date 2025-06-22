export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  slug?: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: { id: string; name: string };
  brand: { id: string; name: string };
  rating?: number;
  reviews?: number;
  stock: number;
  description: string;
  descriptionAr?: string;
  specifications?: Record<string, string>;
  specificationsAr?: Record<string, string>;
  features?: string[];
  featuresAr?: string[];
  isNew?: boolean;
  isFeatured: boolean;
  relatedProducts?: string[];
  sku?: string;
  barcode: string;
  auctionStartDate: string | null;
  auctionEndDate: string | null;
  isActive: boolean;
  isAuction: boolean;
  minimumBidIncrement: number;
  startingBid: number;
  currentBid: number;
  weight: number;
  tags?: string[];
  variants?: unknown[];
  specs?: { nameAr: string; nameEn: string; value: string }[];
  createdAt: string;
  updatedAt: string;
  dimensions?: { length: number; width: number; height: number };
  oldPrice?: number;
  discount?: number;
  bids?: Bid[];
  mainImage :string
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  parentId?: string;
  subCategories?: Category[];
  icon?: string;
  specs?: Array<{
    nameEn: string;
    nameAr: string;
    options: string[];
  }>;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
}

export interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  ratings: number[];
  availability: boolean;
}

export interface AuctionItem {
  id: number;
  productId: number;
  startingPrice: number;
  currentBid: number;
  minimumBidIncrement: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'ended' | 'upcoming';
  bids: Bid[];
}

export interface Bid {
  id: number;
  auctionId: number;
  userId: string;
  userName: string;
  amount: number;
  timestamp: string;
}

// Firestore bid structure
export interface FirestoreBid {
  amount: number;
  time: string;
  userId: string;
  userName: string;
  userPhone?: string;
}
