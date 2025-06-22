import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void; // Added toggle function
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme', // Or your app's theme key
}) => {
  // Initialize with defaultTheme to prevent mismatch during SSR
  // The actual theme will be determined client-side in useEffect
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // This effect runs only on the client side
    let initialTheme = defaultTheme;
    try {
      const storedTheme = window.localStorage.getItem(storageKey) as Theme | null;
      if (storedTheme) {
        initialTheme = storedTheme;
      }
    } catch (e) {
      console.error("Failed to read theme from localStorage", e);
      // Keep defaultTheme if localStorage fails
    }
    
    console.log('DEBUG: ThemeProvider useEffect. initialTheme from storage/default:', initialTheme);

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = initialTheme;
    if (initialTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
      console.log('DEBUG: ThemeProvider useEffect. System theme detected:', effectiveTheme);
    }
    
    root.classList.add(effectiveTheme);
    setThemeState(effectiveTheme); // Set the theme state based on client-side detection

    // No need to depend on `theme` here for initial setup,
    // as this effect is for setting the *initial* client-side theme.
    // Subsequent changes will be handled by the `setTheme` function.
  }, [defaultTheme, storageKey]); // Rerun if defaultTheme or storageKey props change

  const setTheme = (newTheme: Theme) => {
    try {
      window.localStorage.setItem(storageKey, newTheme);
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    let effectiveTheme = newTheme;
    if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      effectiveTheme = systemPrefersDark ? 'dark' : 'light';
    }
    
    root.classList.add(effectiveTheme);
    setThemeState(effectiveTheme); // Update internal state to the resolved theme
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };


  const value: ThemeContextProps = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};