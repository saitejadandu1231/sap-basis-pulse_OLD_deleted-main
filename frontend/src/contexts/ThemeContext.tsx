import { createContext, useContext } from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { useTheme as useNextTheme } from 'next-themes';

interface ThemeContextType {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  systemTheme: string | undefined;
  resolvedTheme: string | undefined;
}


export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Debug log to help trace where this is called
    console.error('useTheme called outside ThemeProvider! Stack:', new Error().stack);
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={true}
      disableTransitionOnChange={false}
    >
      <ThemeProviderWrapper>
        {children}
      </ThemeProviderWrapper>
    </NextThemeProvider>
  );
};

const ThemeProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        systemTheme,
        resolvedTheme
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};