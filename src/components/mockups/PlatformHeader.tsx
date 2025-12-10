import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, Grid3X3, Compass, Settings, LayoutDashboard, Users, FileText } from "lucide-react";
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
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/mockups" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CE</span>
              </div>
              <div>
                <h1 className="text-lg font-bold leading-none">AI-CE Heatmap</h1>
                <p className="text-xs text-muted-foreground">ML-SDV Technology Intelligence</p>
              </div>
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
                        isActive && "bg-primary/10 text-primary"
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
                        "text-xs",
                        isActive && "bg-muted text-foreground"
                      )}
                    >
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </div>
            {showBadge && (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30">
                Preview
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
