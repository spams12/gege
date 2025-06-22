import Link from "next/link";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { AuctionItem, Product } from "@/types"; // Ensure Product type includes name and nameAr
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import CountdownTimer from "./CountdownTimer";
import { formatDate } from "@/utils/timeUtils";
import { Badge, BadgeProps } from "@/components/ui/badge"; // Import BadgeProps
import { Clock } from "lucide-react";

// Define the allowed variants for the Badge based on BadgeProps
type BadgeVariant = BadgeProps["variant"];

interface AuctionCardProps {
  auction: AuctionItem;
  // Expect partial product data with localized name already handled
  product: Partial<Product> & { name: string, images: string[] };
}

const AuctionCard = ({ auction, product }: AuctionCardProps) => {
  const { t, i18n } = useTranslation(); // Get translation
  const currentLanguage = i18n.language;

  // Choose image: prefer first image
  const imageSrc = product.images?.[0] || "/placeholder.svg";

  // Determine status text and styling
  let statusTextKey = '';
  // Explicitly type statusVariant using the defined type alias
  let statusVariant: BadgeVariant = 'outline';
  
  if (auction.status === 'active') {
    statusTextKey = 'auctionCard.statusActive';
    statusVariant = 'default'; // Primary color for active
  } else if (auction.status === 'upcoming') {
    statusTextKey = 'auctionCard.statusUpcoming';
    statusVariant = 'secondary'; // Secondary for upcoming
  } else {
    statusTextKey = 'auctionCard.statusEnded';
  }

  // Determine button text and styling
  let buttonTextKey = '';
  let buttonClass = '';
  if (auction.status === 'active') {
    buttonTextKey = 'common.bidNow';
    buttonClass = 'bg-qabas-gold hover:bg-qabas-gold/90 text-black dark:text-black'; // Gold for active bids
  } else if (auction.status === 'upcoming') {
    buttonTextKey = 'common.viewDetails';
    buttonClass = 'bg-primary hover:bg-primary/90 text-primary-foreground'; // Primary for upcoming
  } else {
    buttonTextKey = 'common.viewResults';
    buttonClass = 'bg-muted hover:bg-muted/80 text-muted-foreground'; // Muted for ended
  }

  return (
    <Card className="group overflow-hidden rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-300 bg-card text-card-foreground h-full flex flex-col"> 
      <Link href={`/auctions/${product.id}`} className="block" aria-label={`View auction for ${product.name}`}>
        {/* Image Container */}
        <div className="w-full aspect-square relative overflow-hidden flex-shrink-0 bg-muted/30 dark:bg-muted/20">
          <img
            src={imageSrc}
            alt={product.name}
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Status Badge */}
          <div className="absolute top-2 start-2 flex flex-col gap-1">
            <Badge variant={statusVariant} className="text-xs px-1.5 py-0.5 max-w-full">
              {t(statusTextKey)}
            </Badge>
          </div>
        </div>
      </Link>

      {/* Content */}
      <CardContent className="p-3 sm:p-4 flex-grow flex flex-col">
        {/* Product info at top */}
        <div className="mb-2 flex-grow">
          <Link href={`/auctions/${product.id}`} className="block mb-1">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors truncate">
              {product.name}
            </h3>
          </Link>
          
          {/* Details with consistent styling */}
          <div className="grid gap-1.5 text-xs text-muted-foreground mt-2">
            <div className="flex justify-between items-center">
              <span>{t('auctionCard.currentPrice')}</span>
              {/* Use nullish coalescing to default to 0 if currentBid is undefined/null */}
              <span className="font-bold text-sm text-primary">{(auction.currentBid ?? 0).toLocaleString()} {t('common.currency')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t('auctionCard.bids')}</span>
              <span className="font-medium">{auction.bids.length}</span>
            </div>
            
            {/* Timer/Date Info with improved styling */}
            <div className="flex justify-between items-center min-h-[20px] mt-1">
              {auction.status === 'active' && (
                <>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {t('auctionCard.timeLeft')}
                  </span>
                  <CountdownTimer endDate={auction.endDate} />
                </>
              )}
              {auction.status === 'upcoming' && (
                <>
                  <span>{t('auctionCard.startsIn')}</span>
                  <span className="font-medium">
                    {formatDate(auction.startDate)}
                  </span>
                </>
              )}
              {auction.status === 'ended' && (
                <>
                  <span>{t('auctionCard.endedOn')}</span>
                  <span className="font-medium">
                    {formatDate(auction.endDate)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Footer Button */}
      <CardFooter className="border-t border-border p-3 sm:p-4 mt-auto">
        <Link
          href={`/auctions/${product.id}`}
          className={`w-full text-center rounded-md py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${buttonClass}`}
        >
          {t(buttonTextKey)}
        </Link>
      </CardFooter>
    </Card>
  );
};

export default AuctionCard;
