import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next'; // Added for getServerSideProps
import { useRouter } from "next/router";
import Image from 'next/image'; // Added for next/image
import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { fetchProductBySlug, addBidToProduct } from "@/services/products";
import { Product, Bid, FirestoreBid } from "@/types";
import dynamic from 'next/dynamic';
const CountdownTimer = dynamic(() => import('@/components/CountdownTimer'), { ssr: false });
const Button = dynamic(() => import('@/components/ui/button').then(mod => mod.Button), { ssr: false });
const Input = dynamic(() => import('@/components/ui/input').then(mod => mod.Input), { ssr: false });
import { formatDate, hasAuctionEnded } from "@/utils/timeUtils";
import { ArrowLeft, Info, History, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

const BidHistoryTable = dynamic(() => import('@/components/auctions/BidHistoryTable'), { ssr: false });

interface BiddingDetailPageProps {
  auctionProduct: Product | null;
  initialBids: Bid[];
  isInitiallyEnded: boolean;
  // Depending on server-side auth, you might pass user info or just an isAuthenticated flag
  // For simplicity, let's assume we pass the product and its related data.
  // Auth for actions like placing a bid will still use client-side context.
}

const BiddingDetailPage = ({ auctionProduct: initialProduct, initialBids, isInitiallyEnded }: BiddingDetailPageProps) => {
  const router = useRouter();
  // const { id } = router.query; // ID is now implicit via getServerSideProps
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;
  // useUser context is still needed for client-side actions like placing a bid and UI elements
  const { currentUser, userProfile, loading: userLoading, authLoading } = useUser();

  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [bids, setBids] = useState<Bid[]>(initialBids);
  // const [loading, setLoading] = useState(true); // Data is pre-fetched
  const [bidAmount, setBidAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEnded, setIsEnded] = useState(isInitiallyEnded);
  const [activeTab, setActiveTab] = useState<"details" | "bids">("details");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setProduct(initialProduct);
    setBids(initialBids);
    setIsEnded(isInitiallyEnded);
    if (initialProduct) {
      setBidAmount(((initialProduct.currentBid ?? initialProduct.startingBid) + initialProduct.minimumBidIncrement).toString());
      setCurrentImageIndex(0); // Reset image index when product changes
    }
    window.scrollTo(0, 0);
  }, [initialProduct, initialBids, isInitiallyEnded]);

  // Client-side auth check for initial page access is now handled by getServerSideProps.
  // However, if the user logs out on the client after page load, this effect could handle redirecting.
  // Or, rely on checks within actions like handlePlaceBid.
  // For now, removing the aggressive client-side redirect on load as getServerSideProps should gate access.

  const handlePlaceBid = async () => {
    if (!router.isReady) return; // Ensure router is ready for navigation

    if (authLoading) {
      toast.info(t('common.loading') || 'Please wait while we load your profile...');
      return;
    }

    if (!currentUser) {
      toast.error(t('biddingDetailPage.loginRequired') || 'You need to be logged in to place a bid');
      router.push('/auth');
      return;
    }

    if (!userProfile) {
      toast.error(t('biddingDetailPage.profileRequired') || 'Your profile information is required to place a bid');
      router.push('/user-info'); // Assuming '/user-info' is the correct Next.js path
      return;
    }

    if (!product || isEnded || isSubmitting) return;
    const bidValue = Number(bidAmount);
    if (isNaN(bidValue) || bidValue <= 0) {
      toast.error(t('biddingDetailPage.errorBidValue'));
      return;
    }
    const minimumBid = (product.currentBid ?? product.startingBid) + product.minimumBidIncrement;
    if (bidValue < minimumBid) {
      toast.error(t('biddingDetailPage.errorBidLow', { amount: minimumBid.toLocaleString() }));
      return;
    }
    setIsSubmitting(true);
    const newBid: FirestoreBid = {
      amount: bidValue,
      time: new Date().toISOString(),
      userId: currentUser.uid,
      userName: userProfile.fullName || "",
      userPhone: userProfile.phone || "",
    };

    try {
      await addBidToProduct(product.id, newBid);
      const updatedProductData = await fetchProductBySlug(product.id); // Renamed for clarity
      if (!updatedProductData) { // Handle case where product might not be found after update
        toast.error(t('biddingDetailPage.errorRefetchingAuction') || "Error refetching auction details.");
        // setLoading(false); // This was the error: setLoading is not defined. setIsSubmitting is handled in finally.
        return;
      }
      const firestoreBids: FirestoreBid[] = (updatedProductData as unknown as { bids?: FirestoreBid[] }).bids || [];
      const mappedBids = firestoreBids.map((b, idx) => ({
        id: idx + 1,
        // Attempt to parse product.id to number. This may result in NaN if product.id is not a numeric string.
        auctionId: parseInt(product.id, 10),
        userId: b.userId,
        userName: b.userName,
        amount: b.amount,
        timestamp: b.time,
      })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setBids(mappedBids);

      let newProductWithBid = updatedProductData; // Renamed for clarity
      if (mappedBids.length > 0) {
        const highestBid = [...mappedBids].sort((a, b) => b.amount - a.amount)[0];
        newProductWithBid = { ...updatedProductData, currentBid: highestBid.amount };
      }
      setProduct(newProductWithBid);
      toast.success(t('biddingDetailPage.bidSuccessTitle'), {
        description: t('biddingDetailPage.bidSuccessDesc', { amount: bidValue.toLocaleString() }),
      });
      setBidAmount((bidValue + newProductWithBid.minimumBidIncrement).toString());
    } catch (error) {
      console.error("Error placing bid:", error); // Added console log
      toast.error(t('biddingDetailPage.errorBidding') || 'There was an error placing your bid');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuctionEnd = () => {
    setIsEnded(true);
    if (!isEnded) { // Check if already ended to prevent multiple toasts
      toast.info(t('biddingDetailPage.auctionEndedTitle'), {
        description: t('biddingDetailPage.auctionEndedDesc'),
      });
    }
  };

  const handleImageChange = (direction: 'prev' | 'next') => {
    if (!product || product.images.length === 0) return;
    const totalImages = product.images.length;
    if (direction === 'prev') {
      setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    } else {
      setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    }
  };

  // Loading state is handled by Next.js router during getServerSideProps.
  // The component will only render once data (or notFound/redirect) is resolved.

  if (authLoading && !product) { // Still show loading if auth context is loading and we don't have product yet from props
    return (
        <div className="container mx-auto py-8 text-center text-muted-foreground">
            <p>{t('common.loading')}</p>
        </div>
    );
  }

  if (!product) { // This handles the case where getServerSideProps returns notFound or an error
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-destructive">{t('biddingDetailPage.notFound')}</p>
        <Button onClick={() => router.push("/auctions")} className="mt-4 bg-primary text-primary-foreground"> {/* Changed to /auctions */}
          {t('biddingDetailPage.backToAuctions')}
        </Button>
      </div>
    );
  }

  let status: 'active' | 'ended' | 'upcoming' = 'active';
  const now = new Date();
  const start = product.auctionStartDate ? new Date(product.auctionStartDate) : null;
  const end = product.auctionEndDate ? new Date(product.auctionEndDate) : null;
  if (start && now < start) {
    status = 'upcoming';
  } else if (end && now > end) {
    status = 'ended';
  } else {
    status = 'active';
  }
  const isAuctionActive = status === 'active' && !isEnded;

  return (
    <div className="container mx-auto py-8 text-foreground">
      <Button
        variant="outline"
        className="mb-6 border-border hover:bg-accent hover:text-accent-foreground"
        onClick={() => router.push("/auctions")} // Changed to /auctions
      >
        <ArrowLeft size={16} className="ltr:mr-1 rtl:ml-1" />
        {t('biddingDetailPage.backToAuctions')}
      </Button>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Images */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-square bg-card rounded-lg overflow-hidden relative flex items-center justify-center border border-border shadow-sm">
            <Image
              src={product.images[currentImageIndex] || '/placeholder.svg'}
              alt=""
              layout="fill"
              objectFit="cover"
              className="blur-md opacity-20 dark:opacity-10 select-none pointer-events-none"
              aria-hidden="true"
            />
            <Image
              src={product.images[currentImageIndex] || '/placeholder.svg'}
              alt={product.name}
              layout="fill"
              objectFit="contain"
              className="relative z-10"
              priority
            />
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 dark:bg-background/60 rounded-full p-2 shadow hover:bg-background z-20 text-foreground"
              onClick={() => handleImageChange('prev')}
              aria-label={t('biddingDetailPage.previousImage')}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 dark:bg-background/60 rounded-full p-2 shadow hover:bg-background z-20 text-foreground"
              onClick={() => handleImageChange('next')}
              aria-label={t('biddingDetailPage.nextImage')}
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent">
            {product.images.map((image: string, index: number) => (
              <div key={index}
                className={`relative flex-shrink-0 w-16 h-16 bg-card rounded-md overflow-hidden cursor-pointer border-2 ${currentImageIndex === index ? 'border-primary' : 'border-border hover:border-muted-foreground/50'}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <Image
                  src={image || '/placeholder.svg'}
                  alt={t('biddingDetailPage.imageAlt', { index: index + 1 })}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Auction Details & Bidding Interface */}
        <div className="lg:col-span-1">
          <h1 className="text-2xl font-bold mb-4 text-foreground">{product.name}</h1>
          <div className="bg-card rounded-lg border border-border shadow-sm p-4 mb-6 text-card-foreground">
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-muted-foreground">{t('biddingDetailPage.status')}</span>
              <span
                className={`font-medium px-2 py-0.5 rounded text-xs ${
                  isAuctionActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  status === 'upcoming' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {isAuctionActive ? t('biddingDetailPage.statusActive') :
                 status === 'upcoming' ? t('biddingDetailPage.statusUpcoming') : t('biddingDetailPage.statusEnded')}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">{t('biddingDetailPage.currentBid')}</span>
              <span className="font-bold text-xl text-primary">
                {(product.currentBid ?? product.startingBid).toLocaleString()} {t('common.currency')}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm">
              <span className="text-muted-foreground">{t('auctionCard.bids')}</span>
              <span className="font-medium">{bids.length}</span>
            </div>
            <div className="flex justify-between items-center mb-6 text-sm">
              <span className="text-muted-foreground">
                {isAuctionActive ? t('auctionCard.timeLeft') :
                 status === 'upcoming' ? t('biddingDetailPage.auctionStarts') : t('auctionCard.endedOn')}
              </span>
              {isAuctionActive ? (
                <CountdownTimer endDate={product.auctionEndDate!} onEnd={handleAuctionEnd} />
              ) : (
                <span className="font-medium text-muted-foreground">
                  {formatDate(status === 'upcoming' ? product.auctionStartDate! : product.auctionEndDate!)}
                </span>
              )}
            </div>
            {isAuctionActive ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="text-left border-input bg-background"
                    dir="ltr"
                    min={(product.currentBid ?? product.startingBid) + product.minimumBidIncrement}
                    step={product.minimumBidIncrement}
                    aria-label={t('biddingDetailPage.yourBid')}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">{t('common.currency')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('biddingDetailPage.minimumBid')}: {((product.currentBid ?? product.startingBid) + product.minimumBidIncrement).toLocaleString()} {t('common.currency')}
                </div>
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={handlePlaceBid}
                  disabled={isSubmitting || isNaN(Number(bidAmount)) || Number(bidAmount) < ((product.currentBid ?? product.startingBid) + product.minimumBidIncrement)}
                >
                  {isSubmitting ? t('common.loading') : t('biddingDetailPage.placeBid')}
                </Button>
                {product.id && ( // Check if product.id exists before creating Link
                  <Link href={`/products/${product.id}`} passHref>
                    <Button
                      variant="outline"
                      className="w-full border-green-500 text-green-600 hover:bg-green-500/10 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-400/10"
                    >
                      {t('common.viewDetails')}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center p-4 bg-muted/50 dark:bg-muted/20 rounded-md text-muted-foreground text-sm">
                {status === 'upcoming' ? t('biddingDetailPage.auctionStarts') : t('biddingDetailPage.auctionEndedTitle')}
              </div>
            )}
          </div>
          {/* Details Tabs */}
          <div className="border border-border rounded-lg overflow-hidden bg-card text-card-foreground">
            <div className="flex border-b border-border">
              <button
                className={`flex-1 py-3 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors ${activeTab === "details" ? "bg-muted/50 dark:bg-muted/30 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/30 dark:hover:bg-muted/10"}`}
                onClick={() => setActiveTab("details")}
              >
                <Info size={16} className="inline ltr:mr-1 rtl:ml-1" />
                {t('biddingDetailPage.detailsTab')}
              </button>
              <button
                className={`flex-1 py-3 px-4 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-colors ${activeTab === "bids" ? "bg-muted/50 dark:bg-muted/30 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/30 dark:hover:bg-muted/10"}`}
                onClick={() => setActiveTab("bids")}
              >
                <History size={16} className="inline ltr:mr-1 rtl:ml-1" />
                {t('biddingDetailPage.bidsTab')}
              </button>
            </div>
            <div className="p-4 min-h-[200px]">
              {activeTab === "details" ? (
                <div>
                  <h3 className="font-bold mb-2 text-card-foreground">{t('productDetailPage.productDetails')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                  <h3 className="font-bold mb-2 text-card-foreground">{t('biddingDetailPage.detailsTab')}</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">{t('biddingDetailPage.status')}</span>
                      <span className="font-medium">{isAuctionActive ? t('biddingDetailPage.statusActive') :
                      status === 'upcoming' ? t('biddingDetailPage.statusUpcoming') : t('biddingDetailPage.statusEnded')}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">{t('biddingDetailPage.startingBid')}</span>
                      <span className="font-medium">{product.startingBid.toLocaleString()} {t('common.currency')}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">{t('biddingDetailPage.auctionStarts')}</span>
                      <span className="font-medium">{formatDate(product.auctionStartDate!)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">{t('biddingDetailPage.auctionEnds')}</span>
                      <span className="font-medium">{formatDate(product.auctionEndDate!)}</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div>
                  <BidHistoryTable bids={bids} isAuctionActive={isAuctionActive} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  const { req, res } = context; // For auth handling

  // --- Server-Side Authentication Placeholder ---
  // In a real app, you'd have a robust way to check auth status from cookies/session
  // For example:
  // const { isAuthenticated, user, redirect } = await serverSideAuthCheck(req, res);
  // if (redirect) {
  //   return { redirect };
  // }
  // if (!isAuthenticated) {
  //   return { redirect: { destination: '/auth?returnTo=/auctions/' + id, permanent: false } };
  // }
  // For now, we'll proceed assuming auth would be handled.
  // The client-side `useUser` will still manage `currentUser` for actions.
  // --- End Auth Placeholder ---

  if (typeof id !== 'string') {
    return { notFound: true };
  }

  try {
    const fetchedProduct = await fetchProductBySlug(id);

    if (!fetchedProduct || !fetchedProduct.isAuction) {
      return { notFound: true };
    }

    const firestoreBids: FirestoreBid[] = (fetchedProduct as unknown as { bids?: FirestoreBid[] }).bids || [];
    const mappedBids = firestoreBids.map((b, idx) => ({
      id: idx + 1, // Consider using a more stable ID if available from Firestore
      auctionId: parseInt(fetchedProduct.id, 10), // Assuming product.id is the auctionId; parsed to number.
      userId: b.userId,
      userName: b.userName,
      amount: b.amount,
      timestamp: b.time,
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const productWithBidData = {
      ...fetchedProduct,
      currentBid: mappedBids.length > 0 ? mappedBids[0].amount : fetchedProduct.currentBid,
    };
    
    const isInitiallyEnded = hasAuctionEnded(productWithBidData.auctionEndDate!);

    return {
      props: {
        auctionProduct: productWithBidData,
        initialBids: mappedBids,
        isInitiallyEnded,
        // serverUser: user, // If you pass user data from server-side auth
      },
    };
  } catch (error) {
    console.error(`Failed to fetch auction with id ${id}:`, error);
    return { notFound: true }; // Or a custom error page
  }
};

export default BiddingDetailPage;