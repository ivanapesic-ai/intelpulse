import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Compass, Home, Bookmark, FileText, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/compass", label: "Briefing", icon: Home, end: true },
  { to: "/compass/signals", label: "My Signals", icon: Bookmark },
  { to: "/compass/studio", label: "Report Studio", icon: FileText },
];

export default function CompassLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0d14] text-slate-100">
      {/* Ambient gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <header className="relative sticky top-0 z-40 border-b border-white/5 bg-[#0a0d14]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/compass" className="flex items-center gap-2.5">
            <div className="relative">
              <Compass className="h-6 w-6 text-cyan-400" strokeWidth={1.5} />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-300" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg tracking-tight">Compass</span>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-amber-300">
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
                      ? "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="hidden text-xs text-slate-500 hover:text-slate-300 md:block"
            >
              ← Back to platform
            </Link>
            <button
              onClick={async () => {
                await signOut();
                navigate("/login");
              }}
              className="rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>

      <footer className="relative border-t border-white/5 py-6 text-center text-xs text-slate-600">
        Compass sandbox · Signal Compass UX experiment · Data is live, layouts are exploratory
      </footer>
    </div>
  );
}
