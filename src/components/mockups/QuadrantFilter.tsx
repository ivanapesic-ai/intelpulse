import { cn } from "@/lib/utils";
import { TechnologyQuadrant } from "@/data/technologies";

interface QuadrantFilterProps {
  activeQuadrants: Set<TechnologyQuadrant>;
  onToggle: (quadrant: TechnologyQuadrant) => void;
}

const quadrantConfig: Record<TechnologyQuadrant, { color: string; bgColor: string; borderColor: string }> = {
  Cloud: { color: "text-sky-400", bgColor: "bg-sky-500/20", borderColor: "border-sky-500/50" },
  Edge: { color: "text-violet-400", bgColor: "bg-violet-500/20", borderColor: "border-violet-500/50" },
  IoT: { color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/50" },
  "AI/ML": { color: "text-rose-400", bgColor: "bg-rose-500/20", borderColor: "border-rose-500/50" },
};

export function QuadrantFilter({ activeQuadrants, onToggle }: QuadrantFilterProps) {
  const quadrants: TechnologyQuadrant[] = ["Cloud", "Edge", "IoT", "AI/ML"];

  return (
    <div className="flex flex-wrap gap-2">
      {quadrants.map((quadrant) => {
        const config = quadrantConfig[quadrant];
        const isActive = activeQuadrants.has(quadrant);

        return (
          <button
            key={quadrant}
            onClick={() => onToggle(quadrant)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
              isActive
                ? cn(config.bgColor, config.borderColor, config.color)
                : "bg-muted/50 border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {quadrant}
          </button>
        );
      })}
    </div>
  );
}
