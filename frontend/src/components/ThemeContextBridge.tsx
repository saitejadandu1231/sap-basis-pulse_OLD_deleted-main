import React, { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

/**
 * ContextBridge for ThemeContext to allow context to cross React portal boundaries (e.g., Radix UI portals).
 * Usage: <ThemeContextBridge><YourPortalContent /></ThemeContextBridge>
 */
export const ThemeContextBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeContext = useContext(ThemeContext);
  return (
    <ThemeContext.Provider value={themeContext}>
      {children}
    </ThemeContext.Provider>
  );
};
