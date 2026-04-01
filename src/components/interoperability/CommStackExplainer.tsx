import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Layers } from "lucide-react";
import { useState } from "react";

const STACK_LAYERS = [
  {
    layer: "Application",
    protocols: ["OCPP 2.0.1", "OpenADR 2.0b", "OSCP"],
    description: "Charge point management, demand response, and grid signaling",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-500",
  },
  {
    layer: "Energy Transfer",
    protocols: ["ISO 15118-20", "ISO 15118-2", "DIN SPEC 70121"],
    description: "Vehicle-to-charger communication, Plug & Charge, bidirectional power transfer (V2G)",
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
  },
  {
    layer: "Network / Transport",
    protocols: ["IEEE 2030.5", "IEC 61851", "HomePlug GP"],
    description: "Smart energy profile, physical signaling, PLC-based data link",
    color: "bg-purple-500/10 border-purple-500/30 text-purple-500",
  },
  {
    layer: "Physical",
    protocols: ["CCS Combo", "MCS", "NACS / J3400"],
    description: "Connector types, power delivery, communication pin assignments",
    color: "bg-orange-500/10 border-orange-500/30 text-orange-500",
  },
];

export function CommStackExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Communication Stack — How It Connects</span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-2">
          {STACK_LAYERS.map((layer, i) => (
            <Card key={layer.layer} className="border-border/50">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[80px]">
                  <Badge variant="outline" className={`text-xs font-mono ${layer.color}`}>
                    L{STACK_LAYERS.length - i}
                  </Badge>
                  <span className="text-xs font-medium text-foreground">{layer.layer}</span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {layer.protocols.map((p) => (
                      <Badge key={p} variant="secondary" className="text-xs">
                        {p}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{layer.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground px-1">
            Each layer depends on the one below. ISO 15118 (Energy Transfer) is the critical interoperability layer — 
            it enables Plug & Charge and V2G across all connector types that support it.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
