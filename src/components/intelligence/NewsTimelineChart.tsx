import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useNewsTimeline } from "@/hooks/useNewsTrends";

interface NewsTimelineChartProps {
  keywordId: string;
}

export function NewsTimelineChart({ keywordId }: NewsTimelineChartProps) {
  const { data: timeline, isLoading } = useNewsTimeline(keywordId);

  const chartData = useMemo(() => {
    if (!timeline) return [];
    return timeline.map((point) => ({
      week: new Date(point.week_start).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      mentions: Number(point.mention_count),
    }));
  }, [timeline]);

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  const hasData = chartData.some((d) => d.mentions > 0);

  if (!hasData) {
    return (
      <p className="text-xs text-muted-foreground italic text-center py-4">
        No timeline data yet for this technology.
      </p>
    );
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <XAxis dataKey="week" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="mentions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
