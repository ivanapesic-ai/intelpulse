import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Compass, LayoutDashboard, LogOut, Brain, Network, Eye, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.svg";
import BrandName from "@/components/BrandName";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/explorer", label: "Explorer", icon: Compass },
  { path: "/intelligence", label: "Intelligence", icon: Brain },
  { path: "/knowledge-graph", label: "Graph", icon: Network },
  { path: "/my-signals", label: "My Signals", icon: Eye },
  { path: "/horizons", label: "Horizons", icon: Layers },
];

export function PlatformHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <img src={logo} alt="pulse11" className="w-8 h-8" width={32} height={32} />
              <h1 className="text-2xl leading-none text-foreground"><BrandName /></h1>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "gap-2",
                        isActive
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
              onClick={handleLogout}
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