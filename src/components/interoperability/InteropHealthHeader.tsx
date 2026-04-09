import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FlaskConical, BookOpen, Activity } from "lucide-react";

interface InteropHealthHeaderProps {
  totalStandards: number;
  totalCharinTests: number;
  activeGithubRepos?: number;
  cordisProjects: number;
  keywordCount: number;
  fullCoverageCount: number;
}

export function InteropHealthHeader({
  totalStandards,
  totalCharinTests,
  cordisProjects,
  keywordCount,
  fullCoverageCount,
}: InteropHealthHeaderProps) {
  // Health score: weighted combination of coverage signals
  const standardsScore = Math.min(totalStandards / 250, 1) * 40; // max 40
  const testScore = Math.min(totalCharinTests / 2000, 1) * 35; // max 35
  const researchScore = Math.min(cordisProjects / 30, 1) * 25; // max 25
  const healthScore = Math.round(standardsScore + testScore + researchScore);

  const healthColor =
    healthScore >= 70 ? "text-emerald-500" : healthScore >= 40 ? "text-yellow-500" : "text-destructive";
  const healthLabel =
    healthScore >= 70 ? "Strong" : healthScore >= 40 ? "Moderate" : "Emerging";
  const healthBg =
    healthScore >= 70
      ? "border-emerald-500/30 bg-emerald-500/5"
      : healthScore >= 40
      ? "border-yellow-500/30 bg-yellow-500/5"
      : "border-destructive/30 bg-destructive/5";

  const stats = [
    { icon: Shield, label: "Standards Mapped", value: totalStandards, accent: "text-primary" },
    { icon: FlaskConical, label: "CharIN Tests", value: totalCharinTests.toLocaleString(), accent: "text-primary" },
    { icon: BookOpen, label: "EU R&D Projects", value: cordisProjects, accent: "text-primary" },
  ];

  return (
    <div className="space-y-4">
      <Card className={`${healthBg}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <Activity className={`h-8 w-8 ${healthColor}`} />
                <span className={`text-4xl font-bold ${healthColor} mt-1`}>{healthScore}</span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Interoperability Health</h2>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      healthScore >= 70
                        ? "border-emerald-500/30 text-emerald-500"
                        : healthScore >= 40
                        ? "border-yellow-500/30 text-yellow-500"
                        : "border-destructive/30 text-destructive"
                    }`}
                  >
                    {healthLabel}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Composite score across {keywordCount} technology keywords — standards coverage, conformance testing,
                  and EU research funding.
                </p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-right">
              <span className="font-medium text-foreground">{fullCoverageCount}/{keywordCount}</span> keywords
              <br />with full signal coverage
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.accent} flex-shrink-0`} />
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
