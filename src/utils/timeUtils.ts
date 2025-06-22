
// Utility functions for time formatting and calculations

/**
 * Format remaining time as days, hours, minutes, seconds
 */
export const formatRemainingTime = (endDate: string): string => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;
  
    // If auction has ended
    if (distance < 0) {
      return "المزاد منتهي";
    }
  
    // Calculate time units
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
    // Format the output based on remaining time
    if (days > 0) {
      return `${days} يوم${days > 1 ? '' : ''} ${hours} ساعة`;
    } else if (hours > 0) {
      return `${hours} ساعة ${minutes} دقيقة`;
    } else if (minutes > 0) {
      return `${minutes} دقيقة ${seconds} ثانية`;
    } else {
      return `${seconds} ثانية`;
    }
  };
  
  /**
   * Check if an auction has ended
   */
  export const hasAuctionEnded = (endDate: string): boolean => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    return now >= end;
  };
  
  /**
   * Format a date string to a localized Arabic date format
   */
  export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  