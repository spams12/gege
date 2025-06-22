import React, { useState, KeyboardEvent, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme
import {
  ShoppingCart, Search, User, Menu, Moon, Globe, Flame, ChevronDown, ChevronUp,
  CircuitBoard, Cpu, MemoryStick, Box, HardDrive, BatteryFull, Fan,
  Keyboard, Mouse, MousePointerClick, LifeBuoy, Headphones, Mic, Speaker,
  Armchair, Table, Cable, Lightbulb, Monitor, Gamepad2, Joystick, Sun,
  X, ChevronRight,
  ChevronLeft, Icon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from "@/components/ui/sheet";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import type { Category } from "@/types";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// --- TypeScript Types remain the same ---
type NavCategory = {
  id: string;
  name: string; // Use actual name
  slugBase: string;
  isDropdown: true;
  subItems: {
    id: string;
    name: string; // Use actual name
    slug: string;
    icon: string;
  }[];
};
type NavDivider = { isDivider: true };
type NavLink = {
  nameKey: string; // Use key for translation
  slug: string;
  icon?: React.ElementType;
  style?: string;
  mobileStyle?: string;
  isDropdown?: false;
};
type DesktopNavItem = NavCategory | NavDivider | NavLink;





interface HeaderProps {
  categories?: Category[];
}

const Header: React.FC<HeaderProps> = ({ categories = [] }) => {
  const { t, i18n } = useTranslation(); 
  const { theme, setTheme, toggleTheme } = useTheme(); 
  const [searchTerm, setSearchTerm] = useState("");
  const [sheetSearchTerm, setSheetSearchTerm] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null); 
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const { cartItems } = useCart();
  const currentLanguage = i18n.language;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Set HTML direction on language change
  useEffect(() => {
    document.documentElement.dir = i18n.dir(currentLanguage);
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage, i18n]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);

  const changeLanguage = (lng: 'en' | 'ar') => {
    i18n.changeLanguage(lng);
  };

  // --- Search Handlers ---
  const handleSearch = (term: string) => {
      if (term.trim()) {
          router.push(`/products?search=${encodeURIComponent(term.trim())}`);
          return true; // Indicate search was performed
      }
      return false;
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
      e?.preventDefault();
      if (handleSearch(searchTerm)) {
          setSearchTerm("");
      }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleSearchSubmit();
      }
  };

  const handleSheetSearchSubmit = (e?: React.FormEvent) => {
       e?.preventDefault();
      if (handleSearch(sheetSearchTerm)) {
          setSheetSearchTerm("");
          setIsSheetOpen(false);
      }
  };
   const handleSheetSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
          handleSheetSearchSubmit();
      }
  };

  // --- Desktop Dropdown Hover Handlers ---
  const handleMouseEnter = (categoryId: string) => {
      if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
      }
      setOpenDropdown(categoryId);
  };

  const handleMouseLeave = () => {
      closeTimeoutRef.current = setTimeout(() => {
          setOpenDropdown(null);
      }, 200); // Shortened delay
  };

  const handleContentMouseEnter = () => {
      if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
      }
  };

  // Build navCategories from categories prop
  const parents = categories.filter((cat) => !cat.parentId);
  const children = categories.filter((cat) => cat.parentId);
  const navCategories: NavCategory[] = parents.map((parent) => ({
    id: parent.id,
    name: currentLanguage === 'ar' ? parent.nameAr : parent.nameEn,
    slugBase: "/products",
    isDropdown: true,
    subItems: children.filter((child) => child.parentId === parent.id).map((child) => ({
      id: child.id,
      name: currentLanguage === 'ar' ? child.nameAr : child.nameEn,
      slug: `?category=${child.id}`,
      icon: child.icon ? child.icon : "Box", // Use firebase icon if available, else default to "Box"
    })),
  }));

  const iconMap: { [key: string]: typeof Icon } = {
    ShoppingCart, Search, User, Menu, Moon, Globe, Flame, ChevronDown, ChevronUp,
    CircuitBoard, Cpu, MemoryStick, Box, HardDrive, BatteryFull, Fan,
    Keyboard, Mouse, MousePointerClick, LifeBuoy, Headphones, Mic, Speaker,
    Armchair, Table, Cable, Lightbulb, Monitor, Gamepad2, Joystick, Sun,
    X, ChevronRight,
    ChevronLeft
  };

  // Place this just before return:
  const desktopNavItems: DesktopNavItem[] = [
    ...(isLoggedIn ? [ { isDivider: true } as NavDivider] : []),
    ...navCategories
  ];

  // --- Render Logic ---
  return (
      <header className="sticky top-0 z-50 bg-background shadow-sm border-b border-border dark:shadow-md dark:shadow-black/10">
          {/* === TOP BAR === */}
          <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">

                  {/* --- Mobile: Left - Menu Trigger --- */}
                  <div className="flex items-center md:hidden">
                      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                          <SheetTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent">
                                  <Menu className="w-5 h-5" />
                              </Button>
                          </SheetTrigger>
                          {/* --- Mobile Sheet Content --- */}
                           <SheetContent side={currentLanguage === 'ar' ? 'right' : 'left'} className="w-full sm:w-[350px] p-0 flex flex-col bg-background">
                               {/* Sheet Header */}
                               <SheetHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
                                   <SheetTitle className="sr-only">{t('header.siteName')}</SheetTitle> {/* Screen reader only */}
                                   <Link href={isLoggedIn ? "/account" : "/auth"} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary" onClick={() => setIsSheetOpen(false)}>
                                       <User className="w-5 h-5" />
                                       {t('header.myAccount')}
                                   </Link>
                                    {/* Logo in center */}
                                   <Link href="/" onClick={() => setIsSheetOpen(false)} className="flex-grow flex justify-center">
                                       <img src="logo.png" alt={t('header.logoAlt')} className="h-7 w-auto dark:brightness-0 dark:invert-[1]"/>
                                   </Link>
                                   <SheetClose asChild>
                                       <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                           <X className="w-5 h-5" />
                                       </Button>
                                   </SheetClose>
                               </SheetHeader>

                              {/* Sheet Search Bar */}
                              <div className="p-4 border-b border-border">
                                  <form className="relative w-full" onSubmit={handleSheetSearchSubmit}>
                                      <Input
                                          className="h-10 ps-4 pe-10 text-base bg-muted border-input focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                                          placeholder={t('common.searchPlaceholder')}
                                          type="text" value={sheetSearchTerm}

                                          onChange={(e) => setSheetSearchTerm(e.target.value)} onKeyDown={handleSheetSearchKeyDown}
                                      />
                                      <Button type="submit" variant="ghost" size="icon" className="absolute end-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={t('header.search')}>
                                          <Search size={20} />
                                      </Button>
                                  </form>
                              </div>


                              {/* Sheet Navigation Area */}
                              <div className="flex-grow overflow-y-auto px-4 py-2 scrollbar-thin">
                                  <p className="text-sm text-muted-foreground mb-3 mt-1 px-2">{t('header.discoverProducts')}</p>
                                  <Accordion type="single" collapsible className="w-full">
                                      {navCategories.map((category) => (
                                          <AccordionItem key={category.id} value={category.id} className="border-b border-border">
                                              <AccordionTrigger className="text-sm font-medium hover:no-underline p-3 hover:bg-accent/50 rounded-md text-foreground">
                                                  <div className="flex items-center gap-3 flex-grow text-start" onClick={(e) => {
                                                       e.stopPropagation();
                                                       const subCategoryIds = category.subItems?.map(item => item.id).join(',');
                                                       const href = subCategoryIds && subCategoryIds.length > 0 ? `${category.slugBase}?category=${subCategoryIds}` : `${category.slugBase}?category=${category.id}`;
                                                       router.push(href);
                                                       setIsSheetOpen(false);
                                                   }}> {/* Align text start */}
                                                      <span>{category.name}</span>
                                                  </div>
                                              </AccordionTrigger>
                                              <AccordionContent className="pt-1 pb-1 ps-5 pe-1"> {/* Use logical properties */}
                                                  <div className="flex flex-col space-y-1">
                                                      {category.subItems?.map((item) => {
                                                          const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Box;
                                                          return (
                                                              <Link
                                                                  key={item.slug} href={`${category.slugBase}${item.slug}`} onClick={() => setIsSheetOpen(false)}
                                                                  className="flex items-center justify-between rounded-md p-3 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                                                              >
                                                                  <div className="flex items-center gap-2">
                                                                      <span>{item.name}</span>
                                                                  </div>
                                                                  {currentLanguage === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                                              </Link>
                                                          );
                                                      })}
                                                  </div>
                                              </AccordionContent>
                                          </AccordionItem>
                                      ))}
                                  </Accordion>
                              </div>

                              {/* Sheet Footer for toggles */}
                              <div className="p-4 border-t border-border mt-auto flex justify-between items-center">
                                  {/* Language Toggle */}
                                  <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => changeLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
                                     className="text-muted-foreground hover:text-foreground"
                                    >
                                        <Globe className="w-4 h-4 ltr:mr-1 ltr:ml-1" />
                                        {currentLanguage === 'ar' ? 'English' : 'العربية'}
                                    </Button>
                                   {/* Theme Toggle */}
                                   <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
                                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                        <span className="sr-only">{t('header.toggleTheme')}</span>
                                   </Button>
                              </div>
                           </SheetContent>
                      </Sheet>
                  </div>

                  {/* --- Desktop: Left - Logo + Text --- */}
                  <div className="hidden md:flex items-center space-x-4 ltr:space-x-reverse">
                      <Link href="/" className="flex items-center gap-2 cursor-pointer">
                           <img src="logo.png" alt={t('header.logoAlt')} className="h-12 w-auto dark:brightness-0 dark:invert-[1]"/>
                      </Link>
                  </div>

                  {/* --- Mobile: Center - Logo Icon Only --- */}
                  <div className="flex items-center md:hidden">
                     <Link href="/" className="flex items-center gap-2 cursor-pointer">
                         <img src="logo.png" alt={t('header.logoAlt')} className="h-10 w-auto dark:brightness-0 dark:invert-[1]"/>
                     </Link>
                  </div>

                  {/* --- Desktop: Center - Search Bar --- */}
                  <div className="hidden md:flex flex-grow max-w-xl mx-4">
                      <form className="relative w-full" onSubmit={handleSearchSubmit}>
                          <Input type="text" placeholder={t('common.searchPlaceholder')} className="w-full h-10 ps-4 pe-10 text-sm bg-muted border-input focus:ring-1 focus:ring-ring placeholder-muted-foreground" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearchKeyDown}/>
                          <Button type="submit" variant="ghost" size="icon" className="absolute end-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground transition-colors" aria-label={t('header.search')}>
                             <Search size={20} />
                          </Button>
                      </form>
                  </div>

                   {/* --- Icons Section (Right) --- */}
                  <div className="flex items-center gap-1 md:gap-2">
                      {/* Desktop Icons */}
                      <div className="hidden md:flex items-center gap-1">
                           {/* Theme Toggle */}
                           <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-accent">
                               <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark-rotate-90 dark:scale-0" />
                               <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                               <span className="sr-only">{t('header.toggleTheme')}</span>
                           </Button>
                           {/* Language Selector */}
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" className="h-10 px-2 w-auto text-muted-foreground hover:text-foreground hover:bg-accent text-sm font-medium">
                                        <Globe className="w-4 h-4 ltr:mr-1 ltr:ml-1" />
                                        {currentLanguage === 'ar' ? t('header.arabic') : t('header.english')}
                                       <ChevronDown className="ltr:ml-1 ltr:mr-1 h-4 w-4" />
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                                   <DropdownMenuItem onClick={() => changeLanguage('ar')} disabled={currentLanguage === 'ar'} className="cursor-pointer hover:bg-accent">
                                       {t('header.arabic')}
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => changeLanguage('en')} disabled={currentLanguage === 'en'} className="cursor-pointer hover:bg-accent">
                                       {t('header.english')}
                                   </DropdownMenuItem>
                               </DropdownMenuContent>
                           </DropdownMenu>
                           {/* Divider */}
                           <div className="h-6 w-px bg-border mx-1"></div>
                           {/* Account Button */}
                           {isLoggedIn ? (
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent" aria-label={t('header.myAccount')}>
                                   <User className="w-5 h-5" />
                                 </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                                 <DropdownMenuItem onClick={() => router.push('/account?tab=orders')}>{t('header.orderHistory') || 'سجل الطلبات'}</DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => router.push('/account?tab=profile')}>{t('header.profile') || 'الملف الشخصي'}</DropdownMenuItem>
                                 <DropdownMenuSeparator />
                                 <DropdownMenuItem onClick={async () => { await auth.signOut(); router.push('/'); }}>{t('header.logout') || 'تسجيل الخروج'}</DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           ) : (
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent" aria-label={t('header.myAccount')} asChild>
                               <Link href="/auth"><User className="w-5 h-5" /></Link>
                             </Button>
                           )}
                      </div>
                      {/* Cart Icon (Visible on both) */}
                      <Link href="/cart" className="relative flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent" aria-label={t('header.cart')}>
                           <ShoppingCart className="w-5 h-5" />
                          {cartItems.length > 0 && (<span className="absolute top-0 end-0 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{cartItems.length > 9 ? '9+' : cartItems.length}</span>)}
                      </Link>
                  </div>
              </div>
          </div>

           {/* === Mobile: Bottom Search Bar (Removed - Integrated into sheet/top bar) === */}
           {/*
           <div className="px-4 py-3 border-b border-border md:hidden bg-background">
               <form className="relative w-full" onSubmit={handleSheetSearchSubmit}>
                   <Input
                       className="h-10 ps-4 pe-10 text-base bg-muted border-input rounded-md focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                       placeholder={t('common.searchPlaceholder')} type="text"
                       value={sheetSearchTerm} onChange={(e) => setSheetSearchTerm(e.target.value)} onKeyDown={handleSheetSearchKeyDown}
                    />
                   <Button type="submit" variant="ghost" size="icon" className="absolute end-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground" aria-label={t('header.search')}>
                       <Search size={20}/>
                   </Button>
               </form>
           </div>
           */}


          {/* === BOTTOM BAR: Desktop Categories Navigation === */}
          <nav className="border-b border-t border-border bg-background/80 backdrop-blur-sm hidden md:block">
              <div className="container mx-auto px-4">
                  <div className="w-full flex justify-center h-12 items-center"> {/* Added height and items-center */}
                      <div className="flex space-x-1 lg:space-x-2 ltr:space-x-reverse">
                          {desktopNavItems.map((category, index) => {
                              if ('isDivider' in category && category.isDivider) {
                                  return <div key={`divider-${index}`} className="h-5 w-px bg-border self-center mx-1"></div>;
                              }

                              if ('isDropdown' in category && category.isDropdown && category.subItems) {
                                  const categoryId = category.id; // Use ID for dropdown state
                                  return (
                                      <DropdownMenu
                                          key={categoryId}
                                          open={openDropdown === categoryId}
                                          onOpenChange={(isOpen) => !isOpen && setOpenDropdown(null)}
                                      >
                                          <DropdownMenuTrigger asChild>
                                              <Button
                                                  variant="ghost"
                                                  className="flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-accent transition-colors"
                                                  onMouseEnter={() => handleMouseEnter(categoryId)}
                                                  onMouseLeave={handleMouseLeave}
                                                  onClick={() => {
                                                       const subCategoryIds = category.subItems?.map(item => item.id).join(',');
                                                       const href = subCategoryIds && subCategoryIds.length > 0 ? `${category.slugBase}?category=${subCategoryIds}` : `${category.slugBase}?category=${category.id}`;
                                                       router.push(href);
                                                  }}
                                                  aria-expanded={openDropdown === categoryId}
                                              >
                                                  {category.name}
                                                  <ChevronDown className={`ltr:ml-1 ltr:mr-1 h-4 w-4 transition-transform duration-200 ${openDropdown === categoryId ? 'rotate-180' : ''}`} />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent
                                              className="w-56 bg-popover text-popover-foreground border-border"
                                              onMouseEnter={handleContentMouseEnter}
                                              onMouseLeave={handleMouseLeave}
                                              align="start" // Align dropdown start
                                          >
                                              {category.subItems.map((item) => {
                                                  const IconComponent = iconMap[item.icon as keyof typeof iconMap] || Box;
                                                  return (
                                                      <DropdownMenuItem key={item.slug} asChild className="cursor-pointer focus:bg-accent focus:text-accent-foreground">
                                                          <Link href={`${category.slugBase}${item.slug}`} className="text-sm w-full" onClick={() => setOpenDropdown(null)}>
                                                              <div className="flex items-center gap-2 py-1">
                                                                  {item.name}
                                                              </div>
                                                          </Link>
                                                      </DropdownMenuItem>
                                                  );
                                              })}
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  );
                              }

                              if (!('isDivider' in category) && (!('isDropdown' in category) || category.isDropdown === false)) {
                                  const navLink = category as NavLink;
                                  const IconComponent = navLink.icon;
                                  return (
                                      <Link
                                          key={navLink.slug}
                                          href={navLink.slug || '#'}
                                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 hover:bg-accent transition-colors text-sm font-medium ${navLink.style || 'text-muted-foreground hover:text-primary'}`}
                                          onMouseEnter={() => setOpenDropdown(null)} // Close other dropdowns on hover
                                      >
                                          {IconComponent && <IconComponent className="w-4 h-4" />}
                                          {t(navLink.nameKey)}
                                      </Link>
                                  );
                              }
                              return null;
                          })}
                      </div>
                  </div>
              </div>
          </nav>
      </header>
  );
};

export default Header;
