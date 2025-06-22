import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface WishlistContextType {
  wishlistItems: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const { t } = useTranslation();

  // Load wishlist from localStorage on initial render
  useEffect(() => {
    const storedWishlist = localStorage.getItem("wishlist");
    if (storedWishlist) {
      try {
        setWishlistItems(JSON.parse(storedWishlist));
      } catch (error) {
        console.error("Error parsing wishlist data from localStorage:", error);
        localStorage.removeItem("wishlist");
      }
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const addToWishlist = (product: Product) => {
    const isAlreadyInWishlist = wishlistItems.some(item => item.id === product.id);
    
    if (!isAlreadyInWishlist) {
      setWishlistItems(prevItems => [...prevItems, product]);
      // Show success toast
      toast.success(t('wishlist.addedToWishlist', { productName: product.name }));
    }
  };

  const removeFromWishlist = (productId: string) => {
    const removedItem = wishlistItems.find(item => item.id === productId);
    setWishlistItems(prevItems => prevItems.filter(item => item.id !== productId));
    
    if (removedItem) {
      // Show removed toast
      toast.success(t('wishlist.removedFromWishlist', { productName: removedItem.name }));
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.some(item => item.id === productId);
  };

  const clearWishlist = () => {
    setWishlistItems([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}; 