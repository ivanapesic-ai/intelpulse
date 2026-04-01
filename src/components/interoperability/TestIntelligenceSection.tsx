import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FlaskConical, ExternalLink, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useCharinEvents, useCharinProtocolSummary } from "@/hooks/useCharinTests";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

export function TestIntelligenceSection() {
  const { data: events, isLoading: eventsLoading } = useCharinEvents();
  const { data: protocols, isLoading: protocolsLoading } = useCharinProtocolSummary();
  const { data: equipment, isLoading: equipmentLoading } = useQuery({
    queryKey: ["charin-equipment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("charin_equipment")
        .select("*")
        .order("pass_rate", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = eventsLoading || protocolsLoading || equipmentLoading;
  const hasEvents = events && events.length > 0;
  const hasProtocols = protocols && protocols.length > 0;
  const hasEquipment = equipment && equipment.length > 0;

  const totalTests = events?.reduce((s, e) => s + (e.total_individual_tests || 0), 0) || 0;
  const totalPairings = events?.reduce((s, e) => s + (e.total_pairings || 0), 0) || 0;

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          Test Intelligence
        </h2>
        <p className="text-muted-foreground mt-1">
          Do things actually work together? Real-world conformance testing data from CharIN VOLTS, Testivals, and ChargeX programs.
        </p>
      </div>

      {!hasEvents && !hasProtocols && !hasEquipment ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <FlaskConical className="h-8 w-8 mx-auto mb-3 opacity-40" />
            No test data loaded yet. Run the CharIN pipeline in Admin → Data Pipeline.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList>
            <TabsTrigger value="events">Test Events</TabsTrigger>
            {hasProtocols && <TabsTrigger value="protocols">Protocol Pass Rates</TabsTrigger>}
            {hasEquipment && <TabsTrigger value="equipment">Equipment Compatibility</TabsTrigger>}
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-foreground">{events?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Test Events</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-foreground">{totalTests.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Individual Tests</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-foreground">{totalPairings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">EV-EVSE Pairings</p>
                </CardContent>
              </Card>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-2xl font-bold text-foreground">
                    {hasProtocols ? protocols!.length : "3+"}
                  </p>
                  <p className="text-xs text-muted-foreground">Protocols Tested</p>
                  {!hasProtocols && hasEvents && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">CCS, ISO 15118, MCS</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Events table */}
            {hasEvents && (
              <Card className="border-border/50">
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
                          <TableHead>Report</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {events!.map((e) => (
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
                            <TableCell className="text-right text-sm">
                              {e.total_individual_tests?.toLocaleString() || "—"}
                            </TableCell>
                            <TableCell className="text-right text-sm">{e.total_pairings || "—"}</TableCell>
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
          </TabsContent>

          {hasProtocols && (
            <TabsContent value="protocols">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Protocol Pass Rates</CardTitle>
                  <CardDescription>Which communication protocols are achieving interoperability in the field?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {protocols!.map((p) => (
                    <div key={p.protocol} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{p.protocol}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{p.total_tests} tests</span>
                          <Badge
                            variant={Number(p.pass_rate_pct) >= 80 ? "default" : Number(p.pass_rate_pct) >= 50 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {p.pass_rate_pct}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={Number(p.pass_rate_pct)} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {hasEquipment && (
            <TabsContent value="equipment">
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Equipment Compatibility</CardTitle>
                  <CardDescription>Which EVs and chargers have been validated together?</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Manufacturer</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-center">ISO 15118</TableHead>
                          <TableHead className="text-center">Plug & Charge</TableHead>
                          <TableHead className="text-center">Bidirectional</TableHead>
                          <TableHead className="text-right">Pass Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {equipment!.slice(0, 15).map((eq) => (
                          <TableRow key={eq.id}>
                            <TableCell className="font-medium text-foreground">{eq.manufacturer}</TableCell>
                            <TableCell className="text-sm">{eq.model}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{eq.equipment_type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {eq.supports_iso15118 ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-center">
                              {eq.supports_plug_and_charge ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-center">
                              {eq.supports_bidirectional ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />}
                            </TableCell>
                            <TableCell className="text-right">
                              {eq.pass_rate != null ? (
                                <Badge variant={Number(eq.pass_rate) >= 80 ? "default" : "secondary"} className="text-xs">
                                  {eq.pass_rate}%
                                </Badge>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
