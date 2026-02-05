 import type { Config } from "tailwindcss";
 
 export default {
   darkMode: ["class"],
   content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
   prefix: "",
   theme: {
     container: {
       center: true,
       padding: '2rem',
       screens: {
         '2xl': '1400px'
       }
     },
     extend: {
       fontFamily: {
         sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
         mono: ['ui-monospace', 'SFMono-Regular', 'SF Mono', 'Consolas', 'monospace'],
       },
       colors: {
         border: {
           DEFAULT: 'hsl(var(--border))',
           secondary: 'hsl(var(--border-secondary))',
           focus: 'hsl(var(--border-focus))',
         },
         input: 'hsl(var(--input))',
         ring: 'hsl(var(--ring))',
         background: {
           DEFAULT: 'hsl(var(--background))',
           secondary: 'hsl(var(--background-secondary))',
           tertiary: 'hsl(var(--background-tertiary))',
           elevated: 'hsl(var(--background-elevated))',
         },
         foreground: {
           DEFAULT: 'hsl(var(--foreground))',
           secondary: 'hsl(var(--foreground-secondary))',
           tertiary: 'hsl(var(--foreground-tertiary))',
           placeholder: 'hsl(var(--foreground-placeholder))',
         },
         primary: {
           DEFAULT: 'hsl(var(--primary))',
           foreground: 'hsl(var(--primary-foreground))'
         },
         'accent-secondary': 'hsl(var(--accent-secondary))',
         secondary: {
           DEFAULT: 'hsl(var(--secondary))',
           foreground: 'hsl(var(--secondary-foreground))'
         },
         destructive: {
           DEFAULT: 'hsl(var(--destructive))',
           foreground: 'hsl(var(--destructive-foreground))'
         },
         muted: {
           DEFAULT: 'hsl(var(--muted))',
           foreground: 'hsl(var(--muted-foreground))'
         },
         accent: {
           DEFAULT: 'hsl(var(--accent))',
           foreground: 'hsl(var(--accent-foreground))'
         },
         popover: {
           DEFAULT: 'hsl(var(--popover))',
           foreground: 'hsl(var(--popover-foreground))'
         },
         card: {
           DEFAULT: 'hsl(var(--card))',
           foreground: 'hsl(var(--card-foreground))'
         },
         sidebar: {
           DEFAULT: 'hsl(var(--sidebar))',
           foreground: 'hsl(var(--sidebar-foreground))',
           primary: 'hsl(var(--sidebar-primary))',
           'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
           accent: 'hsl(var(--sidebar-accent))',
           'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
           border: 'hsl(var(--sidebar-border))',
           ring: 'hsl(var(--sidebar-ring))'
         },
         success: 'hsl(var(--success))',
         warning: 'hsl(var(--warning))',
         info: 'hsl(var(--info))',
         chart: {
           1: 'hsl(var(--chart-1))',
           2: 'hsl(var(--chart-2))',
           3: 'hsl(var(--chart-3))',
           4: 'hsl(var(--chart-4))',
           5: 'hsl(var(--chart-5))',
           6: 'hsl(var(--chart-6))',
         },
       },
       borderRadius: {
         lg: 'var(--radius)',
         md: 'calc(var(--radius) - 2px)',
         sm: 'calc(var(--radius) - 4px)',
         xl: 'calc(var(--radius) + 4px)',
         '2xl': 'calc(var(--radius) + 8px)',
       },
       keyframes: {
         'accordion-down': {
           from: { height: '0' },
           to: { height: 'var(--radix-accordion-content-height)' }
         },
         'accordion-up': {
           from: { height: 'var(--radix-accordion-content-height)' },
           to: { height: '0' }
         },
         'fade-in': {
           from: { opacity: '0' },
           to: { opacity: '1' }
         },
         'fade-in-up': {
           from: { opacity: '0', transform: 'translateY(8px)' },
           to: { opacity: '1', transform: 'translateY(0)' }
         },
         'pulse-expand': {
           '0%': { transform: 'translate(-50%, -50%) scale(0.8)', opacity: '0.08' },
           '50%': { opacity: '0.03' },
           '100%': { transform: 'translate(-50%, -50%) scale(1.5)', opacity: '0' }
         },
         'shake': {
           '0%, 100%': { transform: 'translateX(0)' },
           '25%': { transform: 'translateX(-8px)' },
           '75%': { transform: 'translateX(8px)' }
         },
       },
       animation: {
         'accordion-down': 'accordion-down 0.2s ease-out',
         'accordion-up': 'accordion-up 0.2s ease-out',
         'fade-in': 'fade-in 0.3s ease-out',
         'fade-in-up': 'fade-in-up 0.4s ease-out',
         'pulse-ring': 'pulse-expand 8s ease-out infinite',
         'shake': 'shake 0.4s ease',
       },
       boxShadow: {
         'sm-dark': '0 1px 2px rgba(0, 0, 0, 0.5)',
         'md-dark': '0 4px 12px rgba(0, 0, 0, 0.4)',
         'lg-dark': '0 8px 32px rgba(0, 0, 0, 0.5)',
         'xl-dark': '0 20px 60px rgba(0, 0, 0, 0.6)',
         'glow': '0 8px 24px hsla(234, 56%, 57%, 0.4)',
         'subtle': '0 1px 2px rgba(0, 0, 0, 0.05)',
         'elevated': '0 4px 12px rgba(0, 0, 0, 0.08)',
         'elevated-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
       },
     }
   },
   plugins: [require("tailwindcss-animate")],
 } satisfies Config;