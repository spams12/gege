import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files directly
import enTranslation from '../public/locales/en/translation.json';
import arTranslation from '../public/locales/ar/translation.json';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      ar: {
        translation: arTranslation,
      },
    },
    lng: 'en', // default language
    fallbackLng: 'en', // fallback language
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    ns: ['translation'],
    defaultNS: 'translation',
  });

// Update html direction based on language
i18n.on('languageChanged', (lng) => {
  // Ensure this only runs on the client side
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.documentElement.dir = i18n.dir(lng);
  }
});

export default i18n;