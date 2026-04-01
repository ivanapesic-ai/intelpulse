// src/components/admin/CharinPanel.tsx
// Admin panel for CharIN interoperability test data pipeline

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Play,
  Download,
  FlaskConical,
  Zap,
  Car,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  fetchCharinData,
  useCharinEvents,
  useCharinProtocolSummary,
  useCharinEquipment,
} from "@/hooks/useCharinTests";

const resultIcon = (result: string) => {
  switch (result) {
    case "PASS":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "FAIL":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "PARTIAL":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

export default function CharinPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: events, isLoading: eventsLoading } = useCharinEvents();
  const { data: protocols } = useCharinProtocolSummary();
  const { data: equipment } = useCharinEquipment();

  const totalEvents = events?.length || 0;
  const totalTests =
    events?.reduce((s, e) => s + (e.total_individual_tests || 0), 0) || 0;
  const totalPairings =
    events?.reduce((s, e) => s + (e.total_pairings || 0), 0) || 0;
  const totalEquipment = equipment?.length || 0;

  const handleAction = async (mode: "seed_known" | "scrape_events") => {
    setIsRunning(true);
    setActiveMode(mode);
    try {
      const result = await fetchCharinData(mode);
      toast.success(
        mode === "seed_known"
          ? "Known events seeded successfully"
          : `Scraped ${result.result?.length || 0} event pages`
      );
      queryClient.invalidateQueries({ queryKey: ["charin-events"] });
      queryClient.invalidateQueries({ queryKey: ["charin-protocol-summary"] });
      queryClient.invalidateQueries({ queryKey: ["charin-equipment"] });
    } catch (error: any) {
      toast.error(`CharIN ${mode} failed: ${error.message}`);
    } finally {
      setIsRunning(false);
      setActiveMode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FlaskConical className="h-4 w-4" />
              Test Events
            </div>
            <div className="text-2xl font-bold mt-1">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              Individual Tests
            </div>
            <div className="text-2xl font-bold mt-1">
              {totalTests.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              EV-EVSE Pairings
            </div>
            <div className="text-2xl font-bold mt-1">
              {totalPairings.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Equipment Registry
            </div>
            <div className="text-2xl font-bold mt-1">{totalEquipment}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            CharIN Interoperability Data
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleAction("seed_known")}
                disabled={isRunning}
              >
                {activeMode === "seed_known" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Seed Known Events
              </Button>
              <Button
                onClick={() => handleAction("scrape_events")}
                disabled={isRunning}
              >
                {activeMode === "scrape_events" ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Scrape CharIN Pages
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="events">
            <TabsList>
              <TabsTrigger value="events">Events</TabsTrigger>
              <TabsTrigger value="protocols">Protocols</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>

            {/* Events Tab */}
            <TabsContent value="events" className="mt-4">
              {eventsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading events...
                </div>
              ) : events?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No events loaded yet. Click "Seed Known Events" to populate
                  VOLTS 2023 and ChargeX 2024 data, then "Scrape CharIN Pages"
                  for more.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Tests</TableHead>
                      <TableHead className="text-right">Pairings</TableHead>
                      <TableHead className="text-right">EVs</TableHead>
                      <TableHead className="text-right">EVSEs</TableHead>
                      <TableHead className="text-right">Pass Rate</TableHead>
                      <TableHead>Report</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events?.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.event_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              event.event_type === "VOLTS"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.location || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.start_date
                            ? new Date(event.start_date).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.total_individual_tests?.toLocaleString() || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.total_pairings || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.total_evs || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.total_evses || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {event.overall_pass_rate != null
                            ? `${event.overall_pass_rate}%`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {event.report_url ? (
                            <a
                              href={event.report_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Protocols Tab */}
            <TabsContent value="protocols" className="mt-4">
              {protocols?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No protocol data yet. Upload and process a VOLTS PDF report to
                  populate test results.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Protocol</TableHead>
                      <TableHead className="text-right">Total Tests</TableHead>
                      <TableHead className="text-right">Passed</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Partial</TableHead>
                      <TableHead className="text-right">Pass Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {protocols?.map((p) => (
                      <TableRow key={p.protocol}>
                        <TableCell className="font-medium">
                          {p.protocol}
                        </TableCell>
                        <TableCell className="text-right">
                          {p.total_tests}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {p.passed}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {p.failed}
                        </TableCell>
                        <TableCell className="text-right text-yellow-600">
                          {p.partial}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              p.pass_rate_pct >= 80
                                ? "default"
                                : p.pass_rate_pct >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {p.pass_rate_pct}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            {/* Equipment Tab */}
            <TabsContent value="equipment" className="mt-4">
              {equipment?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No equipment registered yet. Process a VOLTS PDF to extract
                  EV/EVSE data.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>ISO 15118</TableHead>
                      <TableHead>P&C</TableHead>
                      <TableHead>Bidir</TableHead>
                      <TableHead className="text-right">Max kW</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipment?.map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <Badge variant="outline">{eq.equipment_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {eq.manufacturer}
                        </TableCell>
                        <TableCell>{eq.model}</TableCell>
                        <TableCell className="text-sm">
                          {eq.category || "—"}
                        </TableCell>
                        <TableCell>
                          {eq.supports_iso15118 != null
                            ? resultIcon(eq.supports_iso15118 ? "PASS" : "FAIL")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {eq.supports_plug_and_charge != null
                            ? resultIcon(
                                eq.supports_plug_and_charge ? "PASS" : "FAIL"
                              )
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {eq.supports_bidirectional != null
                            ? resultIcon(
                                eq.supports_bidirectional ? "PASS" : "FAIL"
                              )
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {eq.max_power_kw ? `${eq.max_power_kw} kW` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">How to populate test results</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Step 1:</strong> Click "Seed Known Events" to load VOLTS 2023
            and ChargeX 2024 aggregate stats.
          </p>
          <p>
            <strong>Step 2:</strong> Download the VOLTS 2023 report PDF from{" "}
            <a
              href="https://www.charin.global/media/pages/events/volts-2023/b1365217fd-1690895132/volts_testingresults_final_2023.07.25.pdf"
              target="_blank"
              className="text-blue-600 underline"
            >
              CharIN
            </a>{" "}
            and upload it via Admin → Documents.
          </p>
          <p>
            <strong>Step 3:</strong> After the PDF is processed, the individual
            test results and equipment will be extracted automatically using
            Gemini AI.
          </p>
          <p>
            <strong>Step 4:</strong> Click "Scrape CharIN Pages" to fetch
            additional event metadata from CharIN's website via Firecrawl.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
