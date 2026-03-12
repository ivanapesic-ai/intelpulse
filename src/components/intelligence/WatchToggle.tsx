import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWatchlist, useToggleWatch } from "@/hooks/useWatchlist";
import { cn } from "@/lib/utils";

interface WatchToggleProps {
  keywordId: string;
  size?: "sm" | "default";
  className?: string;
}

export function WatchToggle({ keywordId, size = "sm", className }: WatchToggleProps) {
  const { watchedKeywordIds } = useWatchlist();
  const toggleWatch = useToggleWatch();
  const isWatched = watchedKeywordIds.includes(keywordId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={size === "sm" ? "icon" : "default"}
          className={cn(
            "h-7 w-7 shrink-0",
            isWatched && "text-primary",
            className
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleWatch.mutate({ keywordId, watched: isWatched });
          }}
          disabled={toggleWatch.isPending}
        >
          {isWatched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 opacity-40" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isWatched ? "Remove from watchlist" : "Add to watchlist"}
      </TooltipContent>
    </Tooltip>
  );
}
