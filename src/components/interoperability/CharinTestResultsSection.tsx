import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ArrowRight } from "lucide-react";

export function CharinTestResultsSection() {
  return (
    <Card className="border-border/50 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          CharIN Test Events & Results
          <Badge variant="outline" className="text-xs border-primary/30 bg-primary/10 text-primary ml-2">Coming Soon</Badge>
        </CardTitle>
        <CardDescription>
          Interoperability test event data (Testivals), conformance results, and member participation 
          will be populated once the CharIN data pipeline is activated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Test Events (Testivals)", desc: "CharIN-organized interoperability testing events" },
            { label: "Conformance Results", desc: "Pass/fail rates by protocol version and vendor" },
            { label: "Member Companies", desc: "CharIN member participation across technology areas" },
          ].map((item) => (
            <div key={item.label} className="p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowRight className="h-3 w-3" />
          Data source: <code className="text-xs bg-muted px-1 rounded">charin_test_events</code> and <code className="text-xs bg-muted px-1 rounded">charin_test_results</code> tables (pending activation)
        </div>
      </CardContent>
    </Card>
  );
}
