import React from 'react'; // Import React to use React.isValidElement if needed, or simply check type
import { useTranslation } from 'react-i18next';
// Import Lucide icons you might still use
import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";

const FeatureSection = () => {
  const { t } = useTranslation();

  // Use translation keys for titles and descriptions
  // The 'icon' property can now be a JSX element (like a Lucide icon) OR a string (for an image path/URL)
  const features = [
    {
      icon: "newlogo.png", // Example with Lucide icon
      titleKey: "homePage.features.newLogo",
      descriptionKey: "homePage.features.description"
    },
    {
      // Example with an image URL (replace with your actual image path or URL)
      icon: 'qi-logo_175425.svg', // Or 'https://yourdomain.com/images/keycard-icon.svg'
      titleKey: "homePage.features.keyCard",
      descriptionKey: "homePage.features.keyCardDesc"
    },
    {
      icon: <Truck className="h-10 w-10 text-primary" />, // Another Lucide example
      titleKey: "homePage.features.fastDelivery",
      descriptionKey: "homePage.features.fastDeliveryDesc"
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      titleKey: "homePage.features.qualityAssurance",
      descriptionKey: "homePage.features.qualityAssuranceDesc"
    },
    {
      icon: <Headphones className="h-10 w-10 text-primary" />,
      titleKey: "homePage.features.techSupport",
      descriptionKey: "homePage.features.techSupportDesc"
    }
  ];

  // Duplicate features for seamless infinite scroll
  const scrollingFeatures = [...features, ...features];

  return (
    <section className="py-12 bg-muted/50 dark:bg-muted/20">

      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
          {t("productDetailPage.features")}
        </h2> 

        <style>
          {`
            /* Define default direction for LTR */
            :root {
              --marquee-direction: -50%;
            }
            /* Define direction for RTL */
            html[dir="rtl"] {
              --marquee-direction: 50%;
            }

            @keyframes scroll-horizontal {
              0% { transform: translateX(0); }
              100% { transform: translateX(var(--marquee-direction)); } /* Use CSS variable */
            }
            .scrolling-row {
              display: flex;
              width: max-content;
              animation: scroll-horizontal 40s linear infinite; /* Slower duration */
            }
            .scrolling-wrapper {
              overflow: hidden;
              width: 100%;
            }
            /* Ensure images inside the icon container scale correctly */
            .scrolling-row .feature-icon-container img {
               display: block; /* Prevent extra space below image */
               max-width: 100%; /* Ensure image doesn't overflow */
               max-height: 100%; /* Ensure image doesn't overflow */
               object-fit: contain; /* Scale the image without stretching */
               margin: auto; /* Center the image */
            }
          `}
        </style>
        <div className="scrolling-wrapper">
          <div className="scrolling-row gap-x-6 md:gap-x-8">
            {scrollingFeatures.map((feature, index) => (
              <div
                key={index}
                className="min-w-[260px] bg-card p-6 rounded-lg text-center hover:shadow-lg transition-all duration-300 border border-border flex-shrink-0"
              >
                {/* Icon Background */}
                {/* Added 'feature-icon-container' class for potential image styling */}
                <div className="feature-icon-container mx-auto w-16 h-16 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-full mb-4 p-2"> {/* Added p-2 padding for images */}
                  {/* Conditional rendering based on the type of 'feature.icon' */}
                  {typeof feature.icon === 'string' ? (
                    // If it's a string, assume it's an image source and render an <img>
                    <img
                      src={feature.icon}
                      alt={t(feature.titleKey)} // Use the translated title as alt text (important for accessibility)
                      // Image styling is handled by the CSS within the style tag and parent div
                    />
                  ) : (
                    // If it's not a string, assume it's a React element (like a Lucide icon) and render it directly
                    feature.icon
                  )}
                </div>
                {/* Title */}
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {t(feature.titleKey)}
                </h3>
                {/* Description */}
                <p className="text-muted-foreground text-sm">
                  {t(feature.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;