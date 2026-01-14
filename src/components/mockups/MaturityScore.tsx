import { cn } from "@/lib/utils";
import { MATURITY_SCORE_CONFIG, type MaturityScore } from "@/types/database";

interface MaturityScoreDisplayProps {
  score: MaturityScore;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MaturityScoreDisplay({ 
  score, 
  showLabel = true, 
  size = "md",
  className 
}: MaturityScoreDisplayProps) {
  const config = MATURITY_SCORE_CONFIG[score];
  
  const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-10 h-10 text-base",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div 
        className={cn(
          "rounded-full flex items-center justify-center font-bold",
          config.bgColor,
          config.color,
          sizeClasses[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn("text-sm", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
}

interface CompositeScoreBarProps {
  investmentScore: MaturityScore;
  employeesScore: MaturityScore;
  patentsScore: MaturityScore;
  className?: string;
}

export function CompositeScoreBar({ 
  investmentScore, 
  employeesScore, 
  patentsScore,
  className 
}: CompositeScoreBarProps) {
  const scores = [
    { label: "Investment", score: investmentScore },
    { label: "Employees", score: employeesScore },
    { label: "Patents", score: patentsScore },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {scores.map(({ label, score }) => {
        const config = MATURITY_SCORE_CONFIG[score];
        const width = ((score + 1) / 3) * 100; // 0->33%, 1->66%, 2->100%
        
        return (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{label}</span>
              <span className={config.color}>{score}/2</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", config.bgColor.replace("/20", ""))}
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface ScoreLegendProps {
  className?: string;
}

export function ScoreLegend({ className }: ScoreLegendProps) {
  return (
    <div className={cn("flex flex-wrap gap-4 text-sm", className)}>
      {([0, 1, 2] as MaturityScore[]).map(score => {
        const config = MATURITY_SCORE_CONFIG[score];
        return (
          <div key={score} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", config.bgColor.replace("/20", ""))} />
            <span className="text-muted-foreground">
              {score}: {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
