import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next'; 
import { useRouter } from 'next/router'; // Changed from react-router-dom
import { AuctionItem, Product as ProductType } from "@/types";
const Tabs = dynamic(() => import('@/components/ui/tabs').then(mod => mod.Tabs), { ssr: false });
const TabsContent = dynamic(() => import('@/components/ui/tabs').then(mod => mod.TabsContent), { ssr: false });
const TabsList = dynamic(() => import('@/components/ui/tabs').then(mod => mod.TabsList), { ssr: false });
const TabsTrigger = dynamic(() => import('@/components/ui/tabs').then(mod => mod.TabsTrigger), { ssr: false });
import { fetchProductsWithFilters } from "@/services/products";
import { useUser } from "@/contexts/UserContext";
import { toast } from "sonner";
import dynamic from 'next/dynamic';

const AuctionCard = dynamic(() => import('@/components/AuctionCard'), { ssr: false });
const Skeleton = dynamic(() => import('@/components/ui/skeleton').then(mod => mod.Skeleton), { ssr: false });
const AuctionCardSkeleton = dynamic(() => import('@/components/AuctionCardSkeleton'), { ssr: false });

// Removed unused mock function getProductById
const BiddingPage = () => {
  const { t, i18n } = useTranslation(); 
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const currentLanguage = i18n.language;
  const { currentUser, userProfile, loading: userLoading } = useUser(); 
  const router = useRouter(); // Changed from useNavigate

  useEffect(() => {
    setLoading(true);

    if (!currentUser && !userLoading) {
      toast.error(t('biddingPage.loginRequired') || 'You need to be logged in to access auctions');
      router.push('/auth'); // Changed from navigate
      return;
    }

    if (currentUser && !userLoading && !userProfile) {
      toast.error(t('biddingPage.profileRequired') || 'Please complete your profile to access auctions');
      router.push('/user-info'); // Changed from navigate and path
      return;
    }

    if (userLoading) {
      return;
    }

    const fetchAuctionProducts = async () => {
      try {
        // TODO: For performance, consider filtering auction products on the backend
        // if the API supports it, e.g., fetchProductsWithFilters({ isAuction: true })
        const data = await fetchProductsWithFilters({
        });
        const auctionProducts = data.products.filter(p => p.isAuction);
        setProducts(auctionProducts);
      } catch (error) {
        console.error("Error fetching auction products:", error);
        toast.error(t('biddingPage.fetchError', 'Failed to load auctions. Please try again.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctionProducts();
    // TODO: For scalability with many auctions, implement pagination or infinite scrolling.
  }, [currentUser, userProfile, userLoading, router, t]); // Changed navigate to router

  const now = new Date();
  const activeAuctions = products.filter(p => {
    const start = p.auctionStartDate ? new Date(p.auctionStartDate) : null;
    const end = p.auctionEndDate ? new Date(p.auctionEndDate) : null;
    return start && end && start <= now && end > now;
  });
  const upcomingAuctions = products.filter(p => {
    const start = p.auctionStartDate ? new Date(p.auctionStartDate) : null;
    return start && start > now;
  });
  const endedAuctions = products.filter(p => {
    const end = p.auctionEndDate ? new Date(p.auctionEndDate) : null;
    return end && end <= now;
  });


  const renderAuctionGrid = (auctionList: ProductType[], status: 'active' | 'upcoming' | 'ended') => {
     if (loading || userLoading) {
         return (
             <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {[...Array(8)].map((_, index) => <AuctionCardSkeleton key={index} />)}
             </div>
         );
     }
     if (auctionList.length === 0) {
         let messageKey = 'biddingPage.noActiveAuctions'; 
         if (status === 'upcoming') messageKey = 'biddingPage.noUpcomingAuctions';
         if (status === 'ended') messageKey = 'biddingPage.noEndedAuctions';
         return <p className="text-center text-muted-foreground py-8">{t(messageKey)}</p>;
     }
     return (
         <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
             {auctionList.map(product => {
               const auction: AuctionItem = { // Explicitly type auction
                id: Number(product.id),
                productId: Number(product.id),
                startingPrice: product.startingBid ?? 0,
                currentBid: (product.bids && product.bids.length > 0)
                    ? Math.max(...product.bids.map(bid => bid.amount))
                    : (product.startingBid ?? 0),
                minimumBidIncrement: product.minimumBidIncrement ?? 0,
                // Safely handle dates:
                // - Use ISO string if date exists.
                // - If date is missing but expected by status (due to filtering), assert (will error if filtering assumption is wrong).
                // - If date can be missing for the status (e.g., endDate for 'upcoming'), provide a fallback.
                //   Assumes AuctionItem requires non-null string dates.
                startDate: product.auctionStartDate
                    ? new Date(product.auctionStartDate).toISOString()
                    : (status === 'ended' ? new Date(0).toISOString() : product.auctionStartDate!),
                endDate: product.auctionEndDate
                    ? new Date(product.auctionEndDate).toISOString()
                    : (status === 'upcoming' ? new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString() : product.auctionEndDate!),
                status,
                bids: product.bids || [],
            };
               return (
                 <AuctionCard
                   key={product.id}
                   auction={auction}
                   product={product}
                 />
               );
             })}
         </div>
     );
   };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">{t('biddingPage.title')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
          {t('biddingPage.description')}
        </p>
      </div>

      <Tabs defaultValue="active" className="mb-8">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-muted dark:bg-background border border-border rounded-lg p-1 h-auto">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {t('biddingPage.activeTab', { count: activeAuctions.length })}
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
             className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {t('biddingPage.upcomingTab', { count: upcomingAuctions.length })}
          </TabsTrigger>
          <TabsTrigger
            value="ended"
             className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground"
          >
            {t('biddingPage.endedTab', { count: endedAuctions.length })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {renderAuctionGrid(activeAuctions, 'active')}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {renderAuctionGrid(upcomingAuctions, 'upcoming')}
        </TabsContent>

        <TabsContent value="ended" className="mt-6">
           {renderAuctionGrid(endedAuctions, 'ended')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BiddingPage;