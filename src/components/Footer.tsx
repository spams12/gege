import Link from "next/link";
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const isRTL = i18n.dir() === "rtl";

  return (
    <footer className="bg-brand-orange-50 dark:bg-gray-900 text-gray-800 dark:text-gray-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
              {t('footer.aboutTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-base leading-relaxed">
              {t('footer.aboutText')}
            </p>
            <div className={`flex space-x-5 ${isRTL ? "space-x-reverse" : ""}`}>
              <a href="https://www.facebook.com/people/Tech-Shop/100090053855674/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-orange-500 dark:text-gray-400 dark:hover:text-brand-orange-400 transition-colors duration-300">
                <Facebook size={22} />
              </a>
              <a href="https://www.instagram.com/techshop1_/#" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-orange-500 dark:text-gray-400 dark:hover:text-brand-orange-400 transition-colors duration-300">
                <Instagram size={22} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/" className="text-gray-600 hover:text-brand-orange-500 dark:text-gray-400 dark:hover:text-brand-orange-400 transition-colors duration-300">{t('footer.home')}</Link>
              </li>
              <li>
                <Link href="/products" className="text-gray-600 hover:text-brand-orange-500 dark:text-gray-400 dark:hover:text-brand-orange-400 transition-colors duration-300">{t('footer.products')}</Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{t('footer.contact')}</h3>
            <ul className="space-y-4 text-base">
              <li className="flex items-center">
                <Phone size={18} className="ltr:mr-3 rtl:ml-3 flex-shrink-0 text-brand-orange-500" />
                <a href="tel:+9647762511719" className="text-gray-600 hover:text-brand-orange-500 dark:text-gray-400 dark:hover:text-brand-orange-400 transition-colors duration-300" dir="ltr">07721779247</a>
              </li>
              <li className="flex items-start">
                <MapPin size={18} className="ltr:mr-3 rtl:ml-3 mt-1 flex-shrink-0 text-brand-orange-500" />
                <span className="text-gray-600 dark:text-gray-400">{t('footer.address')}</span>
              </li>
            </ul>
          </div>

          
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8 text-center text-gray-500 dark:text-gray-500 text-sm">
          <p>{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;