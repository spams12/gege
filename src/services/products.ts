import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { Product } from "@/types";
import { FirestoreBid } from "@/types";

// Helper function to serialize Firestore Timestamps or JS Dates to ISO strings
// Define helper types for serializeDate
interface FirestoreTimestamp {
  toDate: () => Date;
  // Firestore Timestamps also have seconds and nanoseconds, but toDate is key for conversion
}
type SerializableDateInput = Date | FirestoreTimestamp | string | null | undefined;

const serializeDate = (date: SerializableDateInput): string | null => {
  if (!date) {
    return null;
  }
  // Firestore Timestamp (check for toDate method specifically)
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as FirestoreTimestamp).toDate === 'function') {
    return (date as FirestoreTimestamp).toDate().toISOString();
  }
  // JavaScript Date object
  if (date instanceof Date) {
    return date.toISOString();
  }
  // Already a string (could be an ISO string or other format)
  if (typeof date === 'string') {
    // This part can be enhanced if strict ISO format is required from string inputs
    return date;
  }
  console.warn('Unrecognized date format for serialization:', date, typeof date);
  return null; // Fallback for unrecognized types
};

export interface ProductFilters {
  categoryIds?: string[];
  brandNames?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  searchTerm?: string;
  sortBy?: string;
  limitCount?: number; // This might be superseded by limit for pagination
  specs?: { [specName: string]: string[] } | null; // For filtering by product specifications
  page?: number;
  limit?: number;
}

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description?: string;
  website?: string;
  productsCount?: number;
  createdAt?: Date | string | undefined;
  updatedAt?: Date | string | undefined;
}

interface FetchProductsResult {
  products: Product[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}

export async function fetchProductsWithFilters(filters: ProductFilters = {}): Promise<FetchProductsResult> {
  const constraints: QueryConstraint[] = [];
  const { page = 1, limit = 20 } = filters; // Default to page 1, 20 items per page

  // Category filter
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    // Firestore 'in' queries are limited to 10 items.
    constraints.push(where("category.id", "in", filters.categoryIds.slice(0, 10)));
  }

  // Brand filter
  if (filters.brandNames && filters.brandNames.length > 0) {
    constraints.push(where("brand.name", "in", filters.brandNames.slice(0, 10))); // Firestore 'in' max 10
  }

  // Price filter
  if (typeof filters.priceMin === "number") {
    constraints.push(where("price", ">=", filters.priceMin));
  }
  if (typeof filters.priceMax === "number") {
    constraints.push(where("price", "<=", filters.priceMax));
  }

  // In stock filter
  if (filters.inStock) {
    constraints.push(where("stock", ">", 0));
  }

  // Sorting
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case "price-asc":
        constraints.push(orderBy("price", "asc"));
        break;
      case "price-desc":
        constraints.push(orderBy("price", "desc"));
        break;
      case "newest":
        constraints.push(orderBy("createdAt", "desc"));
        break;
      case "rating":
        constraints.push(orderBy("rating", "desc"));
        break;
      case "featured":
      default:
        constraints.push(orderBy("isFeatured", "desc"));
        break;
    }
  } else {
    constraints.push(orderBy("isFeatured", "desc"));
  }

  // Limit (filters.limitCount is for fetching a specific number, not for pagination directly here)
  // We fetch all matching first, then paginate client-side due to Firestore limitations with complex queries + pagination.
  // If filters.limitCount is present and pagination is not the primary goal, it could be used.
  // For now, pagination (page & limit) will override limitCount if both are somehow passed.

  const q = query(collection(db, "products"), ...constraints);
  const snapshot = await getDocs(q);
  let allMatchingProducts: Product[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: serializeDate(data.createdAt),
      updatedAt: serializeDate(data.updatedAt),
      auctionStartDate: serializeDate(data.auctionStartDate),
      auctionEndDate: serializeDate(data.auctionEndDate),
    } as Product;
  });

  // Search term (client-side, as Firestore can't do full-text search)
  if (filters.searchTerm) {
    const lower = filters.searchTerm.toLowerCase();
    allMatchingProducts = allMatchingProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lower) ||
        (product.nameAr && product.nameAr.toLowerCase().includes(lower)) ||
        (product.description && product.description.toLowerCase().includes(lower)) ||
        (product.descriptionAr && product.descriptionAr.toLowerCase().includes(lower)) ||
        product.brand.name.toLowerCase().includes(lower)
    );
  }

  // Client-side filtering for specs
  if (filters.specs && Object.keys(filters.specs).length > 0) {
    allMatchingProducts = allMatchingProducts.filter((product) => {
      return Object.entries(filters.specs as { [specName: string]: string[] }).every(([specName, selectedOptions]) => {
        if (!selectedOptions || selectedOptions.length === 0) return true;
        if (product.specifications && typeof product.specifications[specName] === 'string') {
          if (selectedOptions.includes(product.specifications[specName] as string)) return true;
        }
        if (product.specs && Array.isArray(product.specs)) {
          const productSpecValues = product.specs
            .filter(s => s.nameEn === specName && s.value)
            .map(s => s.value);
          if (selectedOptions.some(opt => productSpecValues.includes(opt))) return true;
        }
        return false;
      });
    });
  }

  // Client-side pagination
  const totalProducts = allMatchingProducts.length;
  const totalPages = Math.ceil(totalProducts / limit);
  const paginatedProducts = allMatchingProducts.slice((page - 1) * limit, page * limit);

  return {
    products: paginatedProducts,
    totalPages,
    currentPage: page,
    totalProducts,
  };
}

export async function fetchBrands(): Promise<Brand[]> {
  const q = query(collection(db, "brands"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    // Ensure createdAt and updatedAt are serialized
    const createdAt = serializeDate(data.createdAt);
    const updatedAt = serializeDate(data.updatedAt);

    return {
      id: doc.id,
      ...data, // Spread original data
      createdAt, // Overwrite with serialized version
      updatedAt, // Overwrite with serialized version
    } as Brand; // Cast to Brand, ensure Brand type is compatible with string dates
  });
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const docRef = query(collection(db, "products"), where("slug", "==", slug));
  const docSnap = await getDocs(docRef);
  if (!docSnap.empty) {
    const data = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      ...data,
      createdAt: serializeDate(data.createdAt),
      updatedAt: serializeDate(data.updatedAt),
      auctionStartDate: serializeDate(data.auctionStartDate),
      auctionEndDate: serializeDate(data.auctionEndDate),
    } as Product;
  } else {
    return null;
  }
}

export async function fetchAllProducts(limitCount?: number): Promise<Product[]> {
  const constraints: QueryConstraint[] = [];
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  const q = query(collection(db, "products"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: serializeDate(data.createdAt),
      updatedAt: serializeDate(data.updatedAt),
      auctionStartDate: serializeDate(data.auctionStartDate),
      auctionEndDate: serializeDate(data.auctionEndDate),
    } as Product;
  });
}

export async function addBidToProduct(productId: string, bid: FirestoreBid) {
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, {
    bids: arrayUnion(bid)
  });
} 