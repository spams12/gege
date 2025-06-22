import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { Clock } from "lucide-react";
import { formatRemainingTime, hasAuctionEnded } from "@/utils/timeUtils";

interface CountdownTimerProps {
  endDate: string;
  onEnd?: () => void;
}

const CountdownTimer = ({ endDate, onEnd }: CountdownTimerProps) => {
  const { t, i18n } = useTranslation(); // Get translation
  const [timeLeft, setTimeLeft] = useState<string>(() => formatRemainingTime(endDate)); // Initial format
  const [isEnded, setIsEnded] = useState<boolean>(hasAuctionEnded(endDate));

  useEffect(() => {
    // Re-calculate initial time if language changes and not ended
    if (!isEnded) {
        setTimeLeft(formatRemainingTime(endDate));
    }
  }, [i18n.language, endDate, isEnded]);

  useEffect(() => {
    if (isEnded) {
        setTimeLeft(t('countdownTimer.ended')); // Set ended text immediately if already ended
        return;
    }

    const timer = setInterval(() => {
      const ended = hasAuctionEnded(endDate);

      if (ended) {
        clearInterval(timer);
        setIsEnded(true);
        setTimeLeft(t('countdownTimer.ended')); // Use translated "Ended"
        if (onEnd) onEnd();
      } else {
        // Pass language to format function
        setTimeLeft(formatRemainingTime(endDate));
      }
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(timer);
    // Add i18n.language and t to dependencies
  }, [endDate, isEnded, onEnd, i18n.language, t]);

  return (
    <div className={`flex items-center gap-1 text-sm ${isEnded ? 'text-muted-foreground' : 'text-red-600 dark:text-red-500'}`}>
      <Clock size={14} />
      <span className="font-medium tabular-nums">{timeLeft}</span> {/* Use tabular-nums for consistent width */}
    </div>
  );
};

export default CountdownTimer;