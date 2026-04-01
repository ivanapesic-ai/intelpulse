import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle, Users } from "lucide-react";

interface PairingResult {
  ev_manufacturer: string;
  evse_manufacturer: string;
  total: number;
  pass: number;
  fail: number;
  partial: number;
}

function PairingCell({ pairing }: { pairing?: PairingResult }) {
  if (!pairing) {
    return (
      <td className="p-1.5 text-center border border-border/30">
        <span className="text-muted-foreground/20 text-xs">—</span>
      </td>
    );
  }

  const rate = Math.round((pairing.pass / pairing.total) * 100);
  const bg =
    rate >= 90 ? "bg-emerald-500/20 border-emerald-500/30" :
    rate >= 70 ? "bg-yellow-500/15 border-yellow-500/30" :
    "bg-destructive/15 border-destructive/30";
  const icon =
    rate >= 90 ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> :
    rate >= 70 ? <AlertTriangle className="h-3 w-3 text-yellow-500" /> :
    <XCircle className="h-3 w-3 text-destructive" />;

  return (
    <td className={`p-1.5 text-center border ${bg}`}>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col items-center gap-0.5 cursor-default">
              {icon}
              <span className="text-[10px] font-mono text-foreground">{rate}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs font-medium">{pairing.ev_manufacturer} × {pairing.evse_manufacturer}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {pairing.total} tests: {pairing.pass} pass, {pairing.fail} fail, {pairing.partial} partial
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </td>
  );
}

export function ManufacturerCompatibilityMatrix() {
  const { data: testResults, isLoading } = useQuery({
    queryKey: ["manufacturer-compatibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charin_test_results")
        .select("ev_manufacturer, evse_manufacturer, result")
        .not("ev_manufacturer", "is", null)
        .not("evse_manufacturer", "is", null);
      if (error) throw error;
      return data || [];
    },
  });

  const { evManufacturers, evseManufacturers, pairingMap, totalTests, avgPassRate } = useMemo(() => {
    if (!testResults || testResults.length === 0) {
      return { evManufacturers: [], evseManufacturers: [], pairingMap: new Map(), totalTests: 0, avgPassRate: 0 };
    }

    const map = new Map<string, PairingResult>();
    const evSet = new Set<string>();
    const evseSet = new Set<string>();

    for (const r of testResults) {
      if (!r.ev_manufacturer || !r.evse_manufacturer) continue;
      evSet.add(r.ev_manufacturer);
      evseSet.add(r.evse_manufacturer);
      const key = `${r.ev_manufacturer}::${r.evse_manufacturer}`;
      const existing = map.get(key) || {
        ev_manufacturer: r.ev_manufacturer,
        evse_manufacturer: r.evse_manufacturer,
        total: 0, pass: 0, fail: 0, partial: 0,
      };
      existing.total++;
      if (r.result === "PASS") existing.pass++;
      else if (r.result === "FAIL") existing.fail++;
      else existing.partial++;
      map.set(key, existing);
    }

    const totalTests = testResults.length;
    const passCount = testResults.filter(r => r.result === "PASS").length;
    const avgPassRate = totalTests > 0 ? Math.round((passCount / totalTests) * 100) : 0;

    return {
      evManufacturers: Array.from(evSet).sort(),
      evseManufacturers: Array.from(evseSet).sort(),
      pairingMap: map,
      totalTests,
      avgPassRate,
    };
  }, [testResults]);

  if (isLoading) return <Skeleton className="h-60 w-full" />;

  if (evManufacturers.length === 0) return null;

  const testedPairings = pairingMap.size;
  const possiblePairings = evManufacturers.length * evseManufacturers.length;
  const coveragePct = possiblePairings > 0 ? Math.round((testedPairings / possiblePairings) * 100) : 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          Manufacturer Compatibility
        </h2>
        <p className="text-muted-foreground mt-1">
          Which EV manufacturers have been tested against which charger manufacturers? 
          This matrix shows real-world interoperability results from CharIN test events.
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-xs border-border">
          {evManufacturers.length} EV makers × {evseManufacturers.length} EVSE makers
        </Badge>
        <Badge variant="outline" className="text-xs border-border">
          {testedPairings}/{possiblePairings} pairings tested ({coveragePct}%)
        </Badge>
        <Badge variant="outline" className={`text-xs ${avgPassRate >= 80 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500" : "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"}`}>
          {avgPassRate}% avg pass rate
        </Badge>
        <Badge variant="outline" className="text-xs border-border">
          {totalTests} total tests
        </Badge>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-card z-10 p-2 text-left text-xs font-medium text-muted-foreground border-b border-r border-border/50 min-w-[120px]">
                    EV ↓ / EVSE →
                  </th>
                  {evseManufacturers.map((evse) => (
                    <th key={evse} className="p-2 text-center text-[10px] font-medium text-muted-foreground border-b border-border/50 min-w-[70px] max-w-[80px]">
                      <span className="writing-mode-vertical block truncate">{evse}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evManufacturers.map((ev) => (
                  <tr key={ev}>
                    <td className="sticky left-0 bg-card z-10 p-2 text-xs font-medium text-foreground border-r border-border/50 whitespace-nowrap">
                      {ev}
                    </td>
                    {evseManufacturers.map((evse) => (
                      <PairingCell
                        key={`${ev}::${evse}`}
                        pairing={pairingMap.get(`${ev}::${evse}`)}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span>≥90% pass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-yellow-500" />
          <span>70–89% pass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3 w-3 text-destructive" />
          <span>&lt;70% pass</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/40">—</span>
          <span>Not tested</span>
        </div>
      </div>
    </div>
  );
}
