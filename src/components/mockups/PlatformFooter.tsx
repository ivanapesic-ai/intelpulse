import logo from "@/assets/logo.svg";
import BrandName from "@/components/BrandName";

export function PlatformFooter() {
  return (
    <footer className="border-t border-border bg-background py-6">
      <div className="container mx-auto px-4 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <img src={logo} alt="pulse11" className="h-6 w-auto" />
          <BrandName className="text-lg text-foreground" />
        </div>
         <p className="text-sm text-muted-foreground">
           BluSpecs CEI-Sphere Intelligence Platform
         </p>
         <p className="text-xs text-muted-foreground/70">
           Last updated: February 2026 • Powered by House11
         </p>
       </div>
     </footer>
   );
 }