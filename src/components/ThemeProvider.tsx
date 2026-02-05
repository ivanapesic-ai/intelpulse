 import { createContext, useContext, useEffect, useState } from 'react';
 
 type Theme = 'dark' | 'light';
 
 interface ThemeContextType {
   theme: Theme;
   toggleTheme: () => void;
   setTheme: (theme: Theme) => void;
 }
 
 const ThemeContext = createContext<ThemeContextType>({
   theme: 'dark',
   toggleTheme: () => {},
   setTheme: () => {},
 });
 
 export const useTheme = () => useContext(ThemeContext);
 
 export function ThemeProvider({ children }: { children: React.ReactNode }) {
   const [theme, setThemeState] = useState<Theme>('dark');
 
   // Initialize theme from localStorage or system preference
   useEffect(() => {
     const stored = localStorage.getItem('pulse11-theme') as Theme;
     if (stored) {
       setThemeState(stored);
       applyTheme(stored);
     } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
       setThemeState('light');
       applyTheme('light');
     } else {
       applyTheme('dark');
     }
   }, []);
 
   const applyTheme = (newTheme: Theme) => {
     const root = document.documentElement;
     if (newTheme === 'light') {
       root.classList.add('light');
       root.classList.remove('dark');
     } else {
       root.classList.add('dark');
       root.classList.remove('light');
     }
   };
 
   const setTheme = (newTheme: Theme) => {
     setThemeState(newTheme);
     localStorage.setItem('pulse11-theme', newTheme);
     applyTheme(newTheme);
   };
 
   const toggleTheme = () => {
     const newTheme = theme === 'dark' ? 'light' : 'dark';
     setTheme(newTheme);
   };
 
   return (
     <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
       {children}
     </ThemeContext.Provider>
   );
 }