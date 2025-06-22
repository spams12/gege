import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AuctionCardSkeleton = () => (
    <div className="space-y-2 bg-card border border-border rounded-xl p-4 shadow-sm">
        <Skeleton className="h-40 w-full rounded-lg bg-muted" />
        <Skeleton className="h-5 w-3/4 bg-muted" />
        <Skeleton className="h-4 w-1/2 bg-muted" />
        <Skeleton className="h-4 w-full bg-muted" />
        <Skeleton className="h-10 w-full mt-4 bg-muted" />
    </div>
);

export default AuctionCardSkeleton;