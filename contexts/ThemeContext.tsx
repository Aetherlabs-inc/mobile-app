import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { lightTheme, darkTheme, Theme, ThemeMode } from '@/lib/theme';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  theme: typeof lightTheme | typeof darkTheme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Initialize with system theme or default to light
    // TODO: Load from AsyncStorage to persist user preference
    return systemColorScheme === 'dark' ? 'dark' : 'light';
  });
  
  // Note: Removed auto-sync with system theme to allow user preference
  // User can manually toggle dark mode in settings

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  // Ensure theme is always defined
  if (!theme) {
    console.error('Theme is undefined, falling back to lightTheme');
    return (
      <ThemeContext.Provider value={{ theme: lightTheme, mode: 'light', setMode }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Fallback to light theme if context is not available (shouldn't happen in normal usage)
    console.warn('useTheme called outside ThemeProvider, using lightTheme as fallback');
    return lightTheme;
  }
  // Ensure theme is always defined
  if (!context.theme) {
    console.warn('Theme is undefined in context, using lightTheme as fallback');
    return lightTheme;
  }
  return context.theme;
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { mode: 'light' as ThemeMode, setMode: () => {} };
  }
  return { mode: context.mode, setMode: context.setMode };
}

