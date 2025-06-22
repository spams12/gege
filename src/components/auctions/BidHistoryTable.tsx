import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { Clock, User } from "lucide-react";
import { Bid } from "@/types";
import { formatDate } from "@/utils/timeUtils";

const DynamicTable = dynamic(() => import('@/components/ui/table').then(mod => mod.Table), { ssr: false });
const DynamicTableBody = dynamic(() => import('@/components/ui/table').then(mod => mod.TableBody), { ssr: false });
const DynamicTableCell = dynamic(() => import('@/components/ui/table').then(mod => mod.TableCell), { ssr: false });
const DynamicTableHead = dynamic(() => import('@/components/ui/table').then(mod => mod.TableHead), { ssr: false });
const DynamicTableHeader = dynamic(() => import('@/components/ui/table').then(mod => mod.TableHead), { ssr: false });
const DynamicTableRow = dynamic(() => import('@/components/ui/table').then(mod => mod.TableRow), { ssr: false });

interface BidHistoryTableProps {
  bids: Bid[];
  isAuctionActive: boolean;
}

const BidHistoryTable = ({ bids, isAuctionActive }: BidHistoryTableProps) => {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="font-bold mb-3 text-card-foreground">{t('biddingDetailPage.bidsTab')}</h3>
      {bids.length > 0 ? (
        <DynamicTable>
          <DynamicTableHeader>
            <DynamicTableRow className="border-border">
              <DynamicTableHead className="w-[100px] text-muted-foreground">{t('biddingDetailPage.bidderName')}</DynamicTableHead>
              <DynamicTableHead className="text-center text-muted-foreground">{t('biddingDetailPage.bidAmount')}</DynamicTableHead>
              <DynamicTableHead className="text-left text-muted-foreground">{t('biddingDetailPage.bidTime')}</DynamicTableHead>
            </DynamicTableRow>
          </DynamicTableHeader>
          <DynamicTableBody>
            {bids.map((bid) => (
              <DynamicTableRow key={bid.id} className="border-border">
                <DynamicTableCell className="font-medium text-sm">
                   <div className="flex items-center gap-1">
                     <User size={14} className="text-muted-foreground" />
                     {bid.userName || t('account.profile.title')}
                   </div>
                 </DynamicTableCell>
                 <DynamicTableCell className="text-center font-medium text-sm">
                   <div className="flex items-center justify-center gap-1">
                     {bid.amount.toLocaleString()} {t('common.currency')}
                   </div>
                 </DynamicTableCell>
                 <DynamicTableCell className="text-left text-xs text-muted-foreground">
                   <div className="flex items-center gap-1 whitespace-nowrap">
                     <Clock size={14} />
                     {formatDate(bid.timestamp)}
                   </div>
                 </DynamicTableCell>
               </DynamicTableRow>
             ))}
           </DynamicTableBody>
         </DynamicTable>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm mb-2">{t('biddingDetailPage.noBids')}</p>
          {isAuctionActive && (
            <p className="text-sm text-primary">{t('biddingDetailPage.beTheFirst')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BidHistoryTable;