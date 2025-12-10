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

// More detailed SVG paths for EU27 countries
const countryPaths: Record<string, string> = {
  // Nordic countries
  FI: "M295,15 L305,18 L312,35 L318,55 L315,80 L310,100 L302,115 L295,108 L288,95 L285,70 L290,45 L292,25 Z",
  SE: "M258,25 L272,22 L280,40 L285,70 L288,100 L282,130 L275,150 L265,165 L255,155 L250,130 L252,100 L255,60 L256,35 Z",
  
  // Baltic states
  EE: "M302,108 L318,105 L325,112 L322,122 L310,128 L298,122 L300,115 Z",
  LV: "M298,128 L322,122 L328,135 L325,148 L308,152 L295,145 L296,135 Z",
  LT: "M295,152 L318,148 L325,162 L320,178 L302,182 L290,172 L292,160 Z",
  
  // Central Europe
  PL: "M278,175 L320,168 L338,185 L335,210 L318,228 L295,232 L275,222 L268,200 L272,185 Z",
  DE: "M218,175 L268,168 L278,195 L275,225 L258,248 L228,252 L210,238 L205,210 L212,188 Z",
  CZ: "M258,208 L295,202 L302,218 L295,232 L272,238 L255,228 L252,215 Z",
  SK: "M295,215 L328,208 L338,222 L332,238 L308,245 L292,235 Z",
  AT: "M242,242 L285,235 L295,248 L288,265 L262,272 L238,265 L235,252 Z",
  HU: "M295,248 L335,242 L345,262 L338,285 L310,292 L288,282 L290,265 Z",
  
  // Western Europe
  NL: "M195,178 L218,172 L225,188 L222,205 L210,212 L192,205 L190,192 Z",
  BE: "M188,212 L215,208 L222,225 L215,238 L195,242 L182,232 L185,218 Z",
  LU: "M205,238 L218,235 L222,248 L215,255 L202,252 L200,245 Z",
  FR: "M138,215 L192,205 L205,255 L215,295 L195,325 L155,338 L120,328 L108,285 L115,245 L130,225 Z",
  
  // Iberian Peninsula
  ES: "M75,295 L155,280 L168,315 L165,355 L135,378 L95,385 L58,365 L52,328 L60,305 Z",
  PT: "M48,305 L72,298 L78,332 L75,368 L58,378 L45,358 L42,325 Z",
  
  // Italy and neighbors
  IT: "M225,268 L255,262 L272,278 L285,305 L278,345 L265,378 L248,395 L235,388 L228,358 L232,325 L225,295 L218,278 Z",
  SI: "M262,268 L288,262 L295,278 L288,292 L272,298 L258,288 L260,275 Z",
  HR: "M278,288 L315,278 L332,295 L328,325 L305,342 L285,335 L278,312 L280,298 Z",
  MT: "M248,415 L258,412 L262,422 L255,428 L245,425 Z",
  
  // Southeast Europe
  RO: "M325,255 L372,245 L388,275 L382,308 L355,325 L322,318 L315,292 L318,268 Z",
  BG: "M348,318 L388,305 L402,335 L395,362 L365,375 L342,362 L340,338 Z",
  GR: "M325,355 L365,342 L385,365 L378,405 L355,428 L328,422 L315,395 L318,368 Z",
  CY: "M408,402 L428,398 L435,412 L428,425 L412,428 L402,418 Z",
  
  // Ireland and Denmark
  IE: "M95,162 L135,155 L145,178 L142,202 L125,215 L102,208 L92,188 Z",
  DK: "M228,148 L255,142 L262,158 L258,178 L242,188 L225,182 L222,165 Z",
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
            DE: { x: 240, y: 210 },
            FR: { x: 155, y: 275 },
            ES: { x: 110, y: 340 },
            IT: { x: 250, y: 330 },
            PL: { x: 302, y: 200 },
            NL: { x: 208, y: 192 },
            SE: { x: 268, y: 95 },
            FI: { x: 305, y: 65 },
            BE: { x: 200, y: 225 },
            AT: { x: 265, y: 255 },
            CZ: { x: 275, y: 218 },
            HU: { x: 315, y: 268 },
            RO: { x: 355, y: 285 },
            GR: { x: 350, y: 385 },
            PT: { x: 60, y: 338 },
            IE: { x: 118, y: 185 },
            DK: { x: 242, y: 165 },
            BG: { x: 368, y: 345 },
            SK: { x: 315, y: 225 },
            HR: { x: 305, y: 315 },
            SI: { x: 278, y: 282 },
            LT: { x: 308, y: 165 },
            LV: { x: 312, y: 138 },
            EE: { x: 312, y: 115 },
            CY: { x: 418, y: 415 },
            MT: { x: 252, y: 420 },
            LU: { x: 212, y: 248 },
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
