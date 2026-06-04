import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, Bookmark, FileText, LogOut, Network } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import BrandName from "@/components/BrandName";
import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/compass", label: "Briefing", icon: Home, end: true },
  { to: "/compass/ecosystem", label: "Ecosystem", icon: Network },
  { to: "/compass/signals", label: "My Signals", icon: Bookmark },
  { to: "/compass/studio", label: "Workspace", icon: FileText },
];

export default function CompassLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-6">
          <Link to="/compass" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="w-7 h-7" width={28} height={28} />
            <div className="flex items-baseline gap-2">
              <span className="text-lg leading-none"><BrandName /></span>
              <span className="text-foreground-tertiary text-xs">/</span>
              <span className="font-semibold tracking-tight text-base">N1 Signal</span>
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-warning hidden sm:inline">
                Preview
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all",
                    isActive
                      ? "bg-secondary text-foreground shadow-[0_0_0_1px_hsl(var(--border))]"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hidden text-xs text-muted-foreground hover:text-foreground md:block"
            >
              ← Back to platform
            </Link>
            <ThemeToggle />
            <button
              onClick={async () => { await signOut(); navigate("/login"); }}
              className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1480px] px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-foreground-tertiary">
        N1 Signal · UX experiment on <BrandName /> · Data is live, layouts are exploratory
      </footer>
    </div>
  );
}
