import { useEffect } from "react";
import { useRouter } from "next/router";

// No changes needed for i18n or dark mode in this component
const ScrollToTop = () => {
  const { pathname } = useRouter();

  useEffect(() => {
    // Check if window is defined (for SSR or testing environments)
    if (typeof window !== 'undefined') {
      try {
        window.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth' // Optional smooth scrolling
        });
      } catch (e) {
        // Fallback for browsers that don't support smooth scrolling options
        window.scrollTo(0, 0);
      }
    }
  }, [pathname]); // Trigger effect whenever the path changes

  return null; // This component doesn't render anything
};

export default ScrollToTop;