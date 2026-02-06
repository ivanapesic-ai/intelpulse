import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Radar, Grid3X3, Compass, LayoutDashboard, LogOut, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/logo.svg";

const navItems = [
  { path: "/mockups/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/mockups/radar", label: "Radar", icon: Radar },
  // { path: "/mockups/heatmap", label: "Heatmap", icon: Grid3X3 }, // Hidden - rethinking visualizations
  { path: "/mockups/explorer", label: "Explorer", icon: Compass },
  { path: "/mockups/intelligence", label: "Intelligence", icon: Brain },
];

export function PlatformHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/mockups" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={logo} alt="Pulse11" className="h-8 w-auto" />
              <h1 className="text-base font-semibold font-display leading-none text-foreground">Pulse11</h1>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive 
                          ? "bg-secondary text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground gap-2"
              onClick={() => {
                // TODO: Implement actual logout
                window.location.href = '/login';
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}