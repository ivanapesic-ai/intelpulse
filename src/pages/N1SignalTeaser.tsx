import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Radar, LineChart, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";

export default function N1SignalTeaser() {
  const navigate = useNavigate();

  // Already authenticated → straight into N1 Signal
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/compass", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 via-background to-background dark:from-amber-500/5" />
        <div className="absolute -top-40 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-amber-400/15 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">N1 Signal</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login">
              <Button size="sm" variant="ghost">Sign in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gap-1.5 bg-amber-500 text-white hover:bg-amber-600">
                Get access <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
            <Sparkles className="h-3 w-3" /> Private beta
          </span>

          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            The one signal that <span className="text-amber-500">matters next.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            N1 Signal cuts through patents, investment, research and market noise to surface
            the single move worth your attention in software-defined mobility.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg" className="gap-2 bg-amber-500 text-white hover:bg-amber-600">
                Open N1 Signal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button size="lg" variant="outline" className="gap-2">
                See the demo
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Demo access · <span className="font-mono">demo@house11.ai</span>
          </p>
        </section>

        {/* 3 pillars */}
        <section className="mx-auto max-w-5xl px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Radar, title: "One briefing", body: "A daily, ranked read of what changed across the ecosystem — no dashboards to mine." },
              { icon: LineChart, title: "Four signals", body: "Investment, patents, research and market response — fused into one momentum score." },
              { icon: Compass, title: "Three horizons", body: "Today's market, tomorrow's IP, and the research shaping the next decade." },
            ].map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm transition-colors hover:bg-card"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  <p.icon className="h-4 w-4" />
                </div>
                <p className="mt-4 text-sm font-semibold">{p.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/60 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-6 text-center">
          <p className="text-xs text-muted-foreground">
            N1 Signal · A BluSpecs platform · Powered by House11
          </p>
        </div>
      </footer>
    </div>
  );
}
