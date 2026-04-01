import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plug } from "lucide-react";

const PROTOCOLS = [
  {
    connector: "CCS (Combined Charging System)",
    type: "DC Fast / AC",
    regions: "EU, NA, KR, AU",
    iso15118: "Full (v2 & v20)",
    v2g: "Yes",
    charin: "Core spec",
    status: "dominant",
  },
  {
    connector: "CHAdeMO",
    type: "DC Fast",
    regions: "JP (legacy EU/NA)",
    iso15118: "No (proprietary)",
    v2g: "Yes (v2)",
    charin: "No",
    status: "declining",
  },
  {
    connector: "NACS (Tesla / SAE J3400)",
    type: "DC Fast / AC",
    regions: "NA (expanding)",
    iso15118: "Partial (v20 planned)",
    v2g: "Planned",
    charin: "Under review",
    status: "growing",
  },
  {
    connector: "MCS (Megawatt Charging)",
    type: "DC Ultra-fast",
    regions: "Global (HD vehicles)",
    iso15118: "v20 (MCS profile)",
    v2g: "No",
    charin: "Lead spec owner",
    status: "emerging",
  },
  {
    connector: "GB/T",
    type: "DC / AC",
    regions: "China",
    iso15118: "No (GB/T 27930)",
    v2g: "Planned (ChaoJi)",
    charin: "ChaoJi collaboration",
    status: "regional",
  },
];

const STATUS_STYLES: Record<string, string> = {
  dominant: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  growing: "border-blue-500/30 bg-blue-500/10 text-blue-500",
  emerging: "border-purple-500/30 bg-purple-500/10 text-purple-500",
  declining: "border-orange-500/30 bg-orange-500/10 text-orange-500",
  regional: "border-muted-foreground/30 bg-muted/50 text-muted-foreground",
};

export function ProtocolReferenceGrid() {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-primary" />
          Protocol Compatibility Reference
        </CardTitle>
        <CardDescription>
          Charging connector standards, regional adoption, and ISO 15118 / V2G support status.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Connector Standard</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Regions</TableHead>
                <TableHead>ISO 15118</TableHead>
                <TableHead>V2G Support</TableHead>
                <TableHead>CharIN Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROTOCOLS.map((p) => (
                <TableRow key={p.connector}>
                  <TableCell className="font-medium text-foreground">{p.connector}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.type}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.regions}</TableCell>
                  <TableCell className="text-sm">{p.iso15118}</TableCell>
                  <TableCell className="text-sm">{p.v2g}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.charin}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-xs capitalize ${STATUS_STYLES[p.status] || ""}`}>
                      {p.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
