import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, Grid3X3, Compass, Settings, LayoutDashboard, Users, FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/mockups/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/mockups/radar", label: "Radar", icon: Radar },
  { path: "/mockups/heatmap", label: "Heatmap", icon: Grid3X3 },
  { path: "/mockups/explorer", label: "Explorer", icon: Compass },
];

const secondaryItems = [
  { path: "/mockups/annex-a", label: "Annex A", icon: FileText },
  { path: "/mockups/annex-b", label: "Annex B", icon: FileText },
  { path: "/mockups/public", label: "Public Demo", icon: Users },
  { path: "/mockups/admin", label: "Admin", icon: Settings },
];

interface PlatformHeaderProps {
  showBadge?: boolean;
}

export function PlatformHeader({ showBadge = true }: PlatformHeaderProps) {
  const location = useLocation();

  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/mockups" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-indigo flex items-center justify-center shadow-glow-sm">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold font-display leading-none">AI-CE Heatmap</h1>
                <p className="text-xs text-muted-foreground">ML-SDV Intelligence</p>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2 transition-all duration-200",
                        isActive 
                          ? "bg-primary/10 text-primary shadow-glow-sm" 
                          : "hover:bg-primary/5 hover:text-primary"
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
            <div className="hidden lg:flex items-center gap-1">
              {secondaryItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-xs transition-all duration-200",
                        isActive 
                          ? "bg-muted text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
            {showBadge && (
              <Badge className="badge-glass text-xs font-medium">
                Preview
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}