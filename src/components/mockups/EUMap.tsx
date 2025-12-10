import { useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CountryData {
  country: string;
  code: string;
  techCount: number;
  funding: number;
  focus: string;
}

interface EUMapProps {
  data: CountryData[];
  onCountryClick?: (country: CountryData) => void;
}

// Simplified SVG paths for EU countries (approximate shapes)
const countryPaths: Record<string, string> = {
  FI: "M280,20 L300,25 L310,60 L305,100 L290,120 L270,110 L265,70 L275,40 Z",
  SE: "M250,40 L270,35 L275,80 L280,130 L265,160 L245,150 L240,100 L250,60 Z",
  NO: "M220,30 L250,25 L255,70 L250,120 L230,140 L210,130 L205,80 L215,50 Z",
  EE: "M300,105 L320,100 L325,115 L315,125 L295,120 Z",
  LV: "M295,125 L320,120 L325,140 L305,145 L290,140 Z",
  LT: "M290,145 L315,140 L320,165 L300,170 L285,160 Z",
  PL: "M270,165 L310,160 L325,195 L305,220 L265,215 L255,185 Z",
  DE: "M220,170 L265,165 L275,215 L250,240 L210,235 L200,200 Z",
  NL: "M195,175 L220,170 L225,195 L210,205 L190,200 Z",
  BE: "M185,200 L210,195 L215,220 L195,225 L180,215 Z",
  LU: "M200,220 L215,218 L218,235 L203,237 Z",
  FR: "M140,210 L195,200 L210,270 L180,310 L120,300 L110,250 Z",
  ES: "M80,290 L150,280 L160,350 L100,370 L60,340 Z",
  PT: "M55,300 L80,295 L85,355 L60,360 Z",
  IT: "M220,260 L260,250 L275,320 L250,370 L220,360 L210,300 Z",
  AT: "M240,235 L280,230 L285,255 L260,265 L235,260 Z",
  CH: "M200,240 L235,235 L240,260 L215,270 L195,260 Z",
  CZ: "M255,200 L290,195 L295,220 L270,230 L250,220 Z",
  SK: "M290,210 L320,205 L325,225 L305,235 L285,230 Z",
  HU: "M290,235 L325,230 L330,265 L305,275 L280,265 Z",
  SI: "M260,260 L285,255 L290,275 L270,285 L255,278 Z",
  HR: "M275,275 L310,268 L320,310 L295,320 L270,305 Z",
  RO: "M320,250 L365,240 L375,290 L345,305 L310,295 Z",
  BG: "M345,300 L380,290 L390,330 L360,345 L340,335 Z",
  GR: "M320,330 L360,320 L375,380 L340,400 L310,380 Z",
  IE: "M100,160 L140,155 L145,195 L120,205 L95,195 Z",
  DK: "M225,145 L255,140 L260,170 L240,180 L220,170 Z",
};

const getCountryColor = (techCount: number, maxCount: number): string => {
  const intensity = 0.2 + (techCount / maxCount) * 0.7;
  return `hsl(214 100% 49% / ${intensity})`;
};

export function EUMap({ data, onCountryClick }: EUMapProps) {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const maxTechCount = Math.max(...data.map(d => d.techCount));

  const getCountryData = (code: string) => data.find(d => d.code === code);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <svg
        viewBox="40 0 380 420"
        className="w-full h-full"
        style={{ background: "hsl(var(--muted) / 0.3)" }}
      >
        {/* Water/background pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Countries */}
        {Object.entries(countryPaths).map(([code, path]) => {
          const countryData = getCountryData(code);
          const isHovered = hoveredCountry === code;
          const hasData = !!countryData;
          
          return (
            <Tooltip key={code}>
              <TooltipTrigger asChild>
                <path
                  d={path}
                  fill={hasData ? getCountryColor(countryData.techCount, maxTechCount) : "hsl(var(--muted))"}
                  stroke={isHovered ? "hsl(var(--primary))" : "hsl(var(--border))"}
                  strokeWidth={isHovered ? 2 : 1}
                  className="cursor-pointer transition-all duration-200"
                  style={{
                    transform: isHovered ? "scale(1.02)" : "scale(1)",
                    transformOrigin: "center",
                  }}
                  onMouseEnter={() => setHoveredCountry(code)}
                  onMouseLeave={() => setHoveredCountry(null)}
                  onClick={() => countryData && onCountryClick?.(countryData)}
                />
              </TooltipTrigger>
              {countryData && (
                <TooltipContent side="top" className="z-50">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{countryData.country}</p>
                    <p className="text-sm text-muted-foreground">{countryData.techCount} technologies</p>
                    <p className="text-sm text-muted-foreground">€{(countryData.funding / 1e9).toFixed(1)}B funding</p>
                    <p className="text-xs text-primary">Focus: {countryData.focus}</p>
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* Country labels */}
        {Object.entries(countryPaths).map(([code]) => {
          const countryData = getCountryData(code);
          if (!countryData) return null;
          
          // Calculate center of path (approximate)
          const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
          pathEl.setAttribute("d", countryPaths[code]);
          
          // Hardcoded label positions for key countries
          const labelPositions: Record<string, { x: number; y: number }> = {
            DE: { x: 235, y: 200 },
            FR: { x: 155, y: 255 },
            ES: { x: 110, y: 330 },
            IT: { x: 245, y: 310 },
            PL: { x: 290, y: 190 },
            NL: { x: 205, y: 188 },
            SE: { x: 258, y: 100 },
            FI: { x: 290, y: 70 },
            BE: { x: 197, y: 212 },
            AT: { x: 260, y: 245 },
          };
          
          const pos = labelPositions[code];
          if (!pos) return null;
          
          return (
            <text
              key={`label-${code}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              className="pointer-events-none select-none"
              style={{
                fontSize: "10px",
                fontWeight: 600,
                fill: "hsl(var(--foreground))",
              }}
            >
              {code}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur border border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-foreground">Technology Activity</p>
        <div className="flex items-center gap-1">
          <div className="w-16 h-3 rounded" style={{ background: "linear-gradient(to right, hsl(214 100% 49% / 0.2), hsl(214 100% 49% / 0.9))" }} />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
