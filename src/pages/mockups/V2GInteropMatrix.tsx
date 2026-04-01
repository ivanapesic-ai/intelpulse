import { PlatformHeader } from "@/components/mockups/PlatformHeader";
import { PlatformFooter } from "@/components/mockups/PlatformFooter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Clock, Shield, Zap, Cable, Radio, FileCheck, Server } from "lucide-react";

type TestStatus = "pass" | "fail" | "partial" | "pending";

interface TestCase {
  id: string;
  category: string;
  testName: string;
  protocol: string;
  description: string;
  status: TestStatus;
  details?: string;
}

const statusConfig: Record<TestStatus, { label: string; icon: React.ReactNode; className: string }> = {
  pass: { label: "Pass", icon: <CheckCircle2 className="h-4 w-4" />, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  fail: { label: "Fail", icon: <XCircle className="h-4 w-4" />, className: "bg-red-500/15 text-red-400 border-red-500/30" },
  partial: { label: "Partial", icon: <AlertTriangle className="h-4 w-4" />, className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  pending: { label: "Pending", icon: <Clock className="h-4 w-4" />, className: "bg-muted text-muted-foreground border-border" },
};

const testCases: TestCase[] = [
  // Protocol Conformance
  { id: "PC-01", category: "Protocol Conformance", testName: "ISO 15118-20 Bidirectional Power Transfer Setup", protocol: "ISO 15118-20", description: "Verify V2G session initiation with bidirectional energy transfer scheduling using EXI-encoded ServiceDiscovery and ChargeParameterDiscovery messages.", status: "pass", details: "Full AC & DC bidirectional parameter exchange validated." },
  { id: "PC-02", category: "Protocol Conformance", testName: "Plug & Charge TLS Handshake", protocol: "ISO 15118-20 PnC", description: "Validate mutual TLS authentication using V2G PKI certificate chain (OEM Prov. → CPS → Contract).", status: "pass" },
  { id: "PC-03", category: "Protocol Conformance", testName: "EXI Message Schema Validation", protocol: "ISO 15118-20", description: "Confirm all EXI-encoded messages conform to the ISO 15118-20 XML schema (V2G_CI_MsgDef).", status: "partial", details: "3 of 47 message types show non-critical encoding deviations in DepartureTime field." },
  { id: "PC-04", category: "Protocol Conformance", testName: "Fallback to IEC 61851 Basic Charging", protocol: "IEC 61851-1", description: "When ISO 15118 HLC fails, verify graceful fallback to PWM-based basic charging within 5s timeout.", status: "pass" },

  // Communication Stack
  { id: "CS-01", category: "Communication Stack", testName: "SLAC Pairing (HomePlug GreenPHY)", protocol: "ISO 15118-3", description: "Signal Level Attenuation Characterization — verify PLC link establishment between EV and EVSE within 10s.", status: "pass" },
  { id: "CS-02", category: "Communication Stack", testName: "HLC Session Establishment (TCP/TLS)", protocol: "ISO 15118-20", description: "High-Level Communication session setup over IPv6 link-local, including SDP (SECC Discovery Protocol).", status: "pass" },
  { id: "CS-03", category: "Communication Stack", testName: "Wireless V2G (ISO 15118-8)", protocol: "ISO 15118-8", description: "802.11n-based wireless communication alternative to PLC for V2G session management.", status: "pending", details: "Awaiting certified 802.11n V2G module from vendor." },

  // Energy Flow Reversal
  { id: "EF-01", category: "Energy Flow", testName: "Charge → Idle → Discharge Transition", protocol: "ISO 15118-20 BPT", description: "Validate seamless mode transitions with correct PowerDelivery renegotiation and current ramp rates ≤ 10A/s.", status: "pass" },
  { id: "EF-02", category: "Energy Flow", testName: "Reactive Power Injection", protocol: "EN 50549-1", description: "Test Q(U) and Q(P) reactive power control during discharge mode per grid code requirements.", status: "partial", details: "Q(U) characteristic validated; Q(P) shows 2% overshoot at transitions." },
  { id: "EF-03", category: "Energy Flow", testName: "Anti-Islanding Protection", protocol: "EN 50549-2", description: "Verify EVSE disconnects within 2s when grid reference is lost during active discharge.", status: "pass" },
  { id: "EF-04", category: "Energy Flow", testName: "Power Ramp Rate Compliance", protocol: "IEC 61851-23", description: "Confirm discharge power ramp-up/ramp-down rates comply with configured limits (default: 10kW/s).", status: "pass" },

  // Metering & Settlement
  { id: "MS-01", category: "Metering & Settlement", testName: "OCPP 2.0.1 Bidirectional MeterValues", protocol: "OCPP 2.0.1", description: "Verify MeterValues messages correctly distinguish Energy.Active.Import.Register vs Energy.Active.Export.Register.", status: "pass" },
  { id: "MS-02", category: "Metering & Settlement", testName: "Smart Meter ↔ EVSE Reconciliation", protocol: "DLMS/COSEM", description: "Cross-validate grid meter readings against EVSE-reported energy values (tolerance: ±1.5%).", status: "partial", details: "Import readings match; export shows 2.1% deviation on one EVSE model." },
  { id: "MS-03", category: "Metering & Settlement", testName: "Signed Meter Data (Eichrecht/MID)", protocol: "OCPP 2.0.1 + MID", description: "Verify cryptographically signed meter data for regulatory billing compliance in EU markets.", status: "fail", details: "Transparency software rejects signature format from EVSE firmware v2.3." },

  // Grid Services
  { id: "GS-01", category: "Grid Services", testName: "Frequency Containment Reserve (FCR)", protocol: "ENTSO-E", description: "Test automatic power adjustment within 30s in response to grid frequency deviations (±200mHz deadband).", status: "pass" },
  { id: "GS-02", category: "Grid Services", testName: "OpenADR 2.0b Demand Response", protocol: "OpenADR 2.0b", description: "Validate VEN (Virtual End Node) registration, event handling, and opt-in/opt-out for DR events.", status: "pass" },
  { id: "GS-03", category: "Grid Services", testName: "IEEE 2030.5 / CSIP Integration", protocol: "IEEE 2030.5", description: "Test DER (Distributed Energy Resource) registration and power schedule dispatch via CSIP-AUS profile.", status: "pending", details: "Integration scheduled for Q2 2026." },

  // Multi-Vendor
  { id: "MV-01", category: "Multi-Vendor", testName: "OEM A × EVSE Brand X × Backend α", protocol: "ISO 15118-20", description: "End-to-end V2G session: BMW i5 × ABB Terra → ChargePoint backend → Kaluza aggregator.", status: "pass" },
  { id: "MV-02", category: "Multi-Vendor", testName: "OEM B × EVSE Brand Y × Backend β", protocol: "ISO 15118-20", description: "End-to-end V2G session: VW ID.7 × Alpitronic HYC → has·to·be backend → Jedlix aggregator.", status: "partial", details: "Session completes but BPT scheduling shows 15-min offset on departure time." },
  { id: "MV-03", category: "Multi-Vendor", testName: "OEM C × EVSE Brand Z × Backend γ", protocol: "ISO 15118-2 + -20", description: "End-to-end V2G session: Hyundai IONIQ 6 × Kempower S-Series → Hubject backend → Octopus aggregator.", status: "fail", details: "ISO 15118-20 session fails; falls back to -2 (unidirectional only)." },

  // Cybersecurity
  { id: "CY-01", category: "Cybersecurity", testName: "V2G PKI Certificate Chain Validation", protocol: "ISO 15118-20", description: "Validate full chain: V2G Root CA → Sub-CA (CPO/eMSP) → Contract/Provisioning certificate.", status: "pass" },
  { id: "CY-02", category: "Cybersecurity", testName: "TLS 1.3 Session Resumption", protocol: "TLS 1.3", description: "Verify 0-RTT session resumption works correctly for repeat V2G sessions at the same EVSE.", status: "pass" },
  { id: "CY-03", category: "Cybersecurity", testName: "Firmware Update Integrity (CSMS-push)", protocol: "OCPP 2.0.1", description: "Test signed firmware update delivery to EVSE during idle periods, with rollback on verification failure.", status: "partial", details: "Update succeeds but rollback mechanism not triggered correctly on tampered image." },
];

const categories = [...new Set(testCases.map(tc => tc.category))];

const categoryIcons: Record<string, React.ReactNode> = {
  "Protocol Conformance": <FileCheck className="h-4 w-4" />,
  "Communication Stack": <Radio className="h-4 w-4" />,
  "Energy Flow": <Zap className="h-4 w-4" />,
  "Metering & Settlement": <Server className="h-4 w-4" />,
  "Grid Services": <Cable className="h-4 w-4" />,
  "Multi-Vendor": <Cable className="h-4 w-4" />,
  "Cybersecurity": <Shield className="h-4 w-4" />,
};

function StatusBadge({ status }: { status: TestStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

function SummaryCards() {
  const total = testCases.length;
  const pass = testCases.filter(t => t.status === "pass").length;
  const fail = testCases.filter(t => t.status === "fail").length;
  const partial = testCases.filter(t => t.status === "partial").length;
  const pending = testCases.filter(t => t.status === "pending").length;
  const passRate = Math.round((pass / total) * 100);

  const stats = [
    { label: "Total Tests", value: total, color: "text-foreground" },
    { label: "Passed", value: pass, color: "text-emerald-400" },
    { label: "Partial", value: partial, color: "text-amber-400" },
    { label: "Failed", value: fail, color: "text-red-400" },
    { label: "Pending", value: pending, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="bg-card/50 border-border/50">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground whitespace-nowrap">Pass Rate</span>
        <Progress value={passRate} className="flex-1" />
        <span className="text-sm font-medium text-foreground">{passRate}%</span>
      </div>
    </div>
  );
}

export default function V2GInteropMatrix() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PlatformHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Sample</Badge>
            <Badge variant="outline" className="text-xs">V2G</Badge>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-2">
            V2G Charging Interoperability Test Matrix
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Sample conformance & interoperability test results for Vehicle-to-Grid bidirectional charging across ISO 15118-20, OCPP 2.0.1, and EU grid codes.
          </p>
        </div>

        <SummaryCards />

        <Tabs defaultValue="all" className="mt-8">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All Tests</TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="gap-1.5">
                {categoryIcons[cat]}
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", ...categories].map(tab => {
            const filtered = tab === "all" ? testCases : testCases.filter(tc => tc.category === tab);
            return (
              <TabsContent key={tab} value={tab}>
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {tab === "all" ? "All Test Cases" : tab}
                    </CardTitle>
                    <CardDescription>
                      {filtered.length} test{filtered.length !== 1 ? "s" : ""} — {filtered.filter(t => t.status === "pass").length} passed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">ID</TableHead>
                            <TableHead>Test Case</TableHead>
                            <TableHead className="hidden md:table-cell">Protocol</TableHead>
                            <TableHead className="hidden lg:table-cell">Description</TableHead>
                            <TableHead className="w-24">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map(tc => (
                            <TableRow key={tc.id} className="group">
                              <TableCell className="font-mono text-xs text-muted-foreground">{tc.id}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm text-foreground">{tc.testName}</p>
                                  {tc.details && (
                                    <p className="text-xs text-muted-foreground mt-0.5 hidden group-hover:block">{tc.details}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Badge variant="secondary" className="text-xs font-mono">{tc.protocol}</Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-md">{tc.description}</TableCell>
                              <TableCell><StatusBadge status={tc.status} /></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
      <PlatformFooter />
    </div>
  );
}
