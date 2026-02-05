 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { motion } from 'framer-motion';
 import { Sun, Moon, Loader2 } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { useTheme } from '@/components/ThemeProvider';
 import { ThemeToggle } from '@/components/ThemeToggle';
 import { cn } from '@/lib/utils';
 
 export default function LoginPage() {
   const navigate = useNavigate();
   const { theme } = useTheme();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState('');
   const [isSignUp, setIsSignUp] = useState(false);
 
   // Check if already logged in
   useEffect(() => {
     const checkSession = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) {
         navigate('/dashboard');
       }
     };
     checkSession();
 
     const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
       if (event === 'SIGNED_IN' && session) {
         navigate('/dashboard');
       }
     });
 
     return () => subscription.unsubscribe();
   }, [navigate]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     setError('');
     setIsLoading(true);
 
     try {
       if (isSignUp) {
         const { error } = await supabase.auth.signUp({
           email,
           password,
           options: {
             emailRedirectTo: window.location.origin + '/dashboard',
           },
         });
         if (error) throw error;
         setError('Check your email for the confirmation link!');
         setIsLoading(false);
       } else {
         const { error } = await supabase.auth.signInWithPassword({
           email,
           password,
         });
         if (error) throw error;
       }
     } catch (err: any) {
       setError(err.message || 'An error occurred');
       setIsLoading(false);
     }
   };
 
   return (
      <div className="relative min-h-screen w-full overflow-hidden theme-transition flex flex-col">
       {/* Background */}
       <div className="absolute inset-0 -z-10">
         <div className={cn(
           "absolute inset-0",
           theme === 'dark' ? "bg-gradient-dark" : "bg-gradient-light"
         )} />
         <PulseWaves />
       </div>
 
       {/* Navigation */}
       <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
         <div className="flex items-center gap-3">
           <span className="text-2xl font-bold tracking-tight text-foreground">
             Pulse 11
           </span>
         </div>
         <div className="flex items-center gap-6">
           <ThemeToggle />
           <a href="#" className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors">
             Help
           </a>
           <a href="#" className="text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors">
             Docs
           </a>
         </div>
       </nav>
 
       {/* Login Card */}
        <div className="flex-1 flex items-center justify-center z-10 px-4">
          <motion.div
          className="w-full max-w-md"
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
       >
         <div className={cn(
           "glass rounded-xl p-10 md:p-12",
           theme === 'dark' 
             ? "shadow-lg-dark" 
             : "shadow-elevated-lg"
         )}>
           {/* Header */}
           <div className="mb-8 text-center">
             <h1 className="text-2xl font-semibold text-foreground tracking-tight">
               Welcome to Pulse 11
             </h1>
             <p className="mt-2 text-sm text-foreground-secondary">
               ML-SDV Competitive Intelligence
             </p>
           </div>
 
           {/* Form */}
           <form onSubmit={handleSubmit} className="space-y-5">
             <div>
               <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                 Email
               </label>
               <input
                 id="email"
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="you@company.com"
                 className={cn(
                   "w-full h-11 px-4 rounded-md text-sm font-normal transition-all",
                   "bg-background-tertiary border border-border",
                   "text-foreground placeholder:text-foreground-placeholder",
                   "hover:border-border-secondary",
                   "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                   "disabled:opacity-50 disabled:cursor-not-allowed",
                   error && !error.includes('Check') && "border-destructive animate-shake"
                 )}
                 required
                 disabled={isLoading}
               />
             </div>
 
             <div>
               <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                 Password
               </label>
               <input
                 id="password"
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className={cn(
                   "w-full h-11 px-4 rounded-md text-sm font-normal transition-all",
                   "bg-background-tertiary border border-border",
                   "text-foreground placeholder:text-foreground-placeholder",
                   "hover:border-border-secondary",
                   "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10",
                   "disabled:opacity-50 disabled:cursor-not-allowed",
                   error && !error.includes('Check') && "border-destructive animate-shake"
                 )}
                 required
                 disabled={isLoading}
               />
             </div>
 
             {/* Error/Success Message */}
             {error && (
               <motion.div
                 className={cn(
                   "p-3 rounded-md text-sm",
                   error.includes('Check') 
                     ? "bg-success/10 border border-success/30 text-success"
                     : "bg-destructive/10 border border-destructive/30 text-destructive"
                 )}
                 initial={{ opacity: 0, x: -10 }}
                 animate={{ opacity: 1, x: 0 }}
               >
                 {error}
               </motion.div>
             )}
 
             {/* Submit Button */}
             <button
               type="submit"
               disabled={isLoading}
               className={cn(
                 "w-full h-11 rounded-md text-sm font-semibold text-white transition-all",
                 "bg-accent-gradient",
                 "hover:-translate-y-0.5 hover:shadow-glow",
                 "active:translate-y-0",
                 "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none",
                 "flex items-center justify-center gap-2"
               )}
             >
               {isLoading ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin" />
                   <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                 </>
               ) : (
                 <span>{isSignUp ? 'Create account →' : 'Sign in →'}</span>
               )}
             </button>
 
             {/* Toggle Sign Up / Sign In */}
             <p className="text-center text-sm text-foreground-secondary">
               {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
               <button
                 type="button"
                 onClick={() => {
                   setIsSignUp(!isSignUp);
                   setError('');
                 }}
                 className="font-medium text-primary hover:underline"
               >
                 {isSignUp ? 'Sign in' : 'Sign up'}
               </button>
             </p>
 
             {/* Forgot Password */}
             <a 
               href="#" 
               className="block text-center text-sm text-foreground-secondary hover:text-foreground transition-colors"
             >
               Forgot password?
             </a>
           </form>
         </div>
       </motion.div>
        </div>
 
       {/* Footer */}
        <footer className="py-6 z-10">
         <p className="text-xs text-foreground-tertiary">
           Powered by CEI-Sphere Intelligence
         </p>
       </footer>
     </div>
   );
 }
 
 /* Pulse Waves Background Animation */
 function PulseWaves() {
   return (
     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none">
       {[0, 2, 4, 6].map((delay) => (
         <div
           key={delay}
           className="absolute top-1/2 left-1/2 w-full h-full border-2 border-primary/20 rounded-full blur-[60px] animate-pulse-ring"
           style={{ animationDelay: `${delay}s` }}
         />
       ))}
     </div>
   );
 }