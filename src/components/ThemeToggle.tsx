 import { Sun, Moon } from 'lucide-react';
 import { useTheme } from './ThemeProvider';
 import { cn } from '@/lib/utils';
 
 interface ThemeToggleProps {
   className?: string;
 }
 
 export function ThemeToggle({ className }: ThemeToggleProps) {
   const { theme, toggleTheme } = useTheme();
 
   return (
     <button
       onClick={toggleTheme}
       className={cn(
         "relative w-14 h-7 rounded-full border transition-all duration-300 cursor-pointer",
         "bg-background-tertiary border-border hover:border-border-secondary",
         className
       )}
       aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
     >
       <Sun 
         className={cn(
           "absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-all duration-200",
           theme === 'light' ? "text-foreground" : "text-muted-foreground"
         )} 
       />
       <div 
         className={cn(
           "absolute top-0.5 w-5 h-5 rounded-full bg-accent-gradient transition-transform duration-300",
           "shadow-sm",
           theme === 'light' ? "translate-x-7" : "translate-x-0.5"
         )}
       />
       <Moon 
         className={cn(
           "absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 transition-all duration-200",
           theme === 'dark' ? "text-foreground" : "text-muted-foreground"
         )} 
       />
     </button>
   );
 }