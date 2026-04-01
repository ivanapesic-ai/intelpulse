import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FlaskConical, ArrowRight, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { useCharinEvents, useCharinProtocolSummary } from "@/hooks/useCharinTests";
import { Skeleton } from "@/components/ui/skeleton";

const resultIcon = (result: string) => {
  switch (result) {
    case "PASS": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "FAIL": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />;
  }
};

export function CharinTestResultsSection() {
  const { data: events, isLoading: eventsLoading } = useCharinEvents();
  const { data: protocols, isLoading: protocolsLoading } = useCharinProtocolSummary();

  const hasData = (events && events.length > 0) || (protocols && protocols.length > 0);
  const isLoading = eventsLoading || protocolsLoading;

  const totalTests = events?.reduce((s, e) => s + (e.total_individual_tests || 0), 0) || 0;
  const totalPairings = events?.reduce((s, e) => s + (e.total_pairings || 0), 0) || 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          CharIN Test Events & Results
        </h2>
        <p className="text-muted-foreground mt-1">
          Interoperability test event data from VOLTS, Testivals, and ChargeX prescribed testing programs.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !hasData ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-8 text-center">
            <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No CharIN data loaded yet. Run the CharIN pipeline step in the Admin Panel to seed and scrape event data.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ArrowRight className="h-3 w-3" />
              Admin → Data Pipeline → "Fetch CharIN Interop Data"
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{events?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Test Events</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{totalTests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Individual Tests</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{totalPairings.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">EV-EVSE Pairings</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-foreground">{protocols?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Protocols Tested</p>
              </CardContent>
            </Card>
          </div>

          {/* Events table */}
          {events && events.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Events</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Tests</TableHead>
                        <TableHead className="text-right">Pairings</TableHead>
                        <TableHead className="text-right">Pass Rate</TableHead>
                        <TableHead>Report</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium text-foreground">{e.event_name}</TableCell>
                          <TableCell>
                            <Badge variant={e.event_type === "VOLTS" ? "default" : "secondary"} className="text-xs">
                              {e.event_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{e.location || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {e.start_date ? new Date(e.start_date).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm">{e.total_individual_tests?.toLocaleString() || "—"}</TableCell>
                          <TableCell className="text-right text-sm">{e.total_pairings || "—"}</TableCell>
                          <TableCell className="text-right text-sm">
                            {e.overall_pass_rate != null ? `${e.overall_pass_rate}%` : "—"}
                          </TableCell>
                          <TableCell>
                            {e.report_url ? (
                              <a href={e.report_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Protocol pass rates */}
          {protocols && protocols.length > 0 && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Protocol Pass Rates</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protocol</TableHead>
                        <TableHead className="text-right">Tests</TableHead>
                        <TableHead className="text-right">Passed</TableHead>
                        <TableHead className="text-right">Failed</TableHead>
                        <TableHead className="text-right">Pass Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {protocols.map((p) => (
                        <TableRow key={p.protocol}>
                          <TableCell className="font-medium text-foreground">{p.protocol}</TableCell>
                          <TableCell className="text-right text-sm">{p.total_tests}</TableCell>
                          <TableCell className="text-right text-sm text-emerald-500">{p.passed}</TableCell>
                          <TableCell className="text-right text-sm text-destructive">{p.failed}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={p.pass_rate_pct >= 80 ? "default" : p.pass_rate_pct >= 50 ? "secondary" : "destructive"}
                              className="text-xs"
                            >
                              {p.pass_rate_pct}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
