import { useTranslation } from 'react-i18next'; 
import dynamic from 'next/dynamic'; 
import HeroBanner from "@/components/HeroBanner"; 

const CategorySection = dynamic(() => import('@/components/CategorySection'));
const FeaturedProducts = dynamic(() => import('@/components/FeaturedProducts'));
const NewArrivals = dynamic(() => import('@/components/NewArrivals'));
import { Product as ProductType } from '@/types'; // Assuming Product type is defined
import { useEffect, useRef, useState, useCallback, useMemo, useContext } from "react";
import { dbAdmin } from "@/lib/firebaseAdmin";
import type { HeroBannerItem } from "@/components/HeroBanner";
import { fetchAllProductsAdmin } from '@/services/products';
import { AuthContext } from '@/contexts/AuthContext'; // Import AuthContext
import type { GetServerSideProps } from 'next'; // Added GetServerSideProps

// Dynamically imported components
const BrandsSection = dynamic(() => import('@/components/BrandsSection'));

interface IndexPageProps {
  initialHeroBanners: HeroBannerItem[];
  initialProducts: ProductType[];
}

const Index = ({ initialHeroBanners, initialProducts }: IndexPageProps) => {
  return (
    <div className="bg-brand-orange-50 text-foreground">
      <HeroBanner banners={initialHeroBanners} />
      <FeaturedProducts products={initialProducts} loading={false} />
      <NewArrivals products={initialProducts} loading={false} />
      <CategorySection />
      <BrandsSection />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<IndexPageProps> = async (context) => {
  let heroBanners: HeroBannerItem[] = [];
  let products: ProductType[] = [];

  try {
    if (dbAdmin) {
      const heroQuery = dbAdmin.collection("heroBanners").orderBy("createdAt", "desc");
      const heroSnapshot = await heroQuery.get();
      heroBanners = heroSnapshot.docs.map(doc => ({
        imageUrl: doc.data().imageUrl,
        productId: doc.data().productId,
      }));
    }
  } catch (err) {
    console.error("Failed to fetch hero banners in getServerSideProps:", err);
    // heroBanners remains []
  }

  try {
    // Fetch a limited number of products for the initial load to reduce page size
    products = await fetchAllProductsAdmin(10); // Limit to 10 products
  } catch (err) {
    console.error("Failed to fetch products in getServerSideProps:", err);
    // products remains []
  }

  return {
    props: {
      initialHeroBanners: heroBanners,
      initialProducts: products,
    },
  };
};

export default Index;