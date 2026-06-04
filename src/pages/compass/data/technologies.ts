// N1 Signal — Technology catalog (prototype data ported from remix)
// Single source of truth for Home, Ecosystem, Watchlist and deep-dive surfaces.

export type Quadrant = "qw" | "bb" | "wt" | "rt";
export type Driver = "Investments" | "Patents" | "News" | "Research";
export type Maturity = "Emerging" | "Growing" | "Mature" | "Declining";

export type DomainId =
  | "vehicles-core"
  | "energy-power"
  | "autonomy-intelligence";

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
}

export const DOMAINS: Domain[] = [
  { id: "vehicles-core", name: "Vehicles & Core Systems", short: "Vehicles" },
  { id: "energy-power", name: "Energy & Power Systems", short: "Energy" },
  { id: "autonomy-intelligence", name: "Autonomy & Intelligence Systems", short: "Autonomy" },
];

export interface QuadrantMeta {
  id: Quadrant;
  label: string;
  sub: string;
  bg: string;
  text: string;
  subText: string;
  axis: string;
}

export const QUADRANTS_META: QuadrantMeta[] = [
  { id: "qw", label: "Quick wins", sub: "Prioritize", bg: "#EAF3DE", text: "#3B6D11", subText: "#639922", axis: "High impact · Low effort" },
  { id: "bb", label: "Big bets", sub: "Accelerate", bg: "#E6F1FB", text: "#185FA5", subText: "#378ADD", axis: "High impact · High effort" },
  { id: "wt", label: "When time permits", sub: "Monitor", bg: "#FAEEDA", text: "#854F0B", subText: "#BA7517", axis: "Low impact · Low effort" },
  { id: "rt", label: "Rethink", sub: "Challenge assumptions", bg: "#FAECE7", text: "#993C1D", subText: "#D85A30", axis: "Low impact · High effort" },
];

export interface SubTech {
  name: string;
  score: number;
  change30d: number;
}

export interface Technology {
  id: string;
  name: string;
  shortName?: string;
  domain: DomainId;
  color: string;
  base: [number, number, number, number];
  quadrant: Quadrant;
  topDriver: Driver;
  driverPct: number;
  maturity: Maturity;
  description: string;
  change30d: number;
  history: number[];
  companies: number;
  investment: number;
  employees: number;
  subtechs: SubTech[];
}

function history(end: number, totalDelta: number): number[] {
  const start = end - totalDelta;
  const arr: number[] = [];
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    const linear = start + (end - start) * t;
    const wobble = Math.sin(i * 1.3) * 1.5 + Math.cos(i * 0.7) * 1.1;
    arr.push(Math.max(0, Math.min(100, Math.round(linear + wobble))));
  }
  arr[11] = Math.max(0, Math.min(100, Math.round(end)));
  return arr;
}

export const TECHS: Technology[] = [
  { id: "ev", name: "Electric Vehicle", shortName: "EV", domain: "vehicles-core", color: "#378ADD", base: [6, 13, 21, 28], quadrant: "bb", topDriver: "Investments", driverPct: 75, maturity: "Growing", description: "Battery-electric passenger and commercial vehicle platforms across OEMs.", change30d: 4.2, history: history(78, 18), companies: 1240, investment: 86400, employees: 412000, subtechs: [{ name: "Sustainable Mobility", score: 61, change30d: 8.3 }, { name: "Electric Mobility", score: 62, change30d: 4.5 }, { name: "Autonomous Driving", score: 48, change30d: 6.7 }, { name: "Smart City", score: 48, change30d: 0.8 }, { name: "Software Defined Vehicle", score: 50, change30d: 1.4 }, { name: "EV Charging", score: 47, change30d: -2.8 }] },
  { id: "sdv", name: "Software Defined Vehicle", shortName: "SDV", domain: "vehicles-core", color: "#7F77DD", base: [8, 17, 27, 35], quadrant: "bb", topDriver: "Investments", driverPct: 78, maturity: "Growing", description: "Zonal architectures, service-oriented stacks and feature-on-demand monetization.", change30d: 6.7, history: history(86, 22), companies: 380, investment: 24800, employees: 145000, subtechs: [{ name: "Electric Mobility", score: 91, change30d: -3.2 }, { name: "EV Charging", score: 94, change30d: -2.4 }, { name: "Battery Electric Vehicle", score: 88, change30d: 4.2 }, { name: "Autonomous Driving", score: 94, change30d: 8.3 }, { name: "Vehicle as Software", score: 56, change30d: 3.6 }, { name: "Smart City", score: 44, change30d: 3.2 }] },
  { id: "ems", name: "Energy Management Systems", shortName: "EMS", domain: "energy-power", color: "#639922", base: [2, 6, 11, 16], quadrant: "qw", topDriver: "News", driverPct: 58, maturity: "Growing", description: "Onboard and fleet-level optimization of energy flows across battery, drive and HVAC.", change30d: 2.4, history: history(66, 11), companies: 290, investment: 6100, employees: 41000, subtechs: [{ name: "Smart City", score: 46, change30d: 3.0 }, { name: "Vehicle to Grid", score: 54, change30d: 4.9 }, { name: "Smart Grid", score: 51, change30d: -1.6 }, { name: "Fleet Management", score: 42, change30d: 3.1 }, { name: "Renewable Energy Sources", score: 47, change30d: -1.3 }] },
  { id: "bms", name: "Battery Management Systems", shortName: "BMS", domain: "energy-power", color: "#5DCAA5", base: [1, 4, 9, 13], quadrant: "qw", topDriver: "Patents", driverPct: 62, maturity: "Mature", description: "Cell monitoring, balancing and safety logic — a settled, patent-heavy field.", change30d: 1.1, history: history(63, 7), companies: 175, investment: 3400, employees: 22000, subtechs: [{ name: "Micromobility", score: 48, change30d: 2.9 }, { name: "Vehicle to Grid", score: 50, change30d: 0.1 }, { name: "Vehicle Safety", score: 43, change30d: -0.1 }, { name: "Software Defined Vehicle", score: 50, change30d: -1.7 }, { name: "EV Battery", score: 45, change30d: 7.4 }] },
  { id: "ev-battery", name: "EV Battery", shortName: "Battery", domain: "energy-power", color: "#1D9E75", base: [5, 12, 20, 27], quadrant: "bb", topDriver: "Research", driverPct: 68, maturity: "Growing", description: "Cell chemistry, solid-state and pack-level innovation driving range and cost.", change30d: 5.3, history: history(77, 17), companies: 520, investment: 38200, employees: 168000, subtechs: [{ name: "Battery Electric Vehicle", score: 61, change30d: 1.8 }, { name: "Storage Battery Systems", score: 59, change30d: 8.7 }, { name: "Vehicle to Grid", score: 40, change30d: 5.8 }, { name: "Battery Management Systems", score: 48, change30d: -3.0 }, { name: "Software Defined Vehicle", score: 46, change30d: 3.4 }] },
  { id: "v2x", name: "Vehicle to Everything", shortName: "V2X", domain: "energy-power", color: "#EF9F27", base: [-1, 1, 3, 5], quadrant: "wt", topDriver: "Research", driverPct: 45, maturity: "Emerging", description: "Communication between vehicles, infrastructure, grid and pedestrians — slow rollout.", change30d: 0.8, history: history(48, 4), companies: 95, investment: 1850, employees: 12000, subtechs: [{ name: "Vehicle to Grid", score: 78, change30d: 0.1 }, { name: "EV Charging", score: 72, change30d: 3.5 }, { name: "Bidirectional Charging", score: 72, change30d: -3.1 }, { name: "Software Defined Vehicle", score: 48, change30d: 5.1 }, { name: "Smart City", score: 42, change30d: -3.2 }] },
  { id: "v2g", name: "Vehicle to Grid", shortName: "V2G", domain: "energy-power", color: "#E24B4A", base: [-3, -7, -12, -17], quadrant: "rt", topDriver: "News", driverPct: 55, maturity: "Declining", description: "Bidirectional charging back to the grid — stalling on hardware cost and regulation.", change30d: -3.6, history: history(31, -12), companies: 60, investment: 720, employees: 4800, subtechs: [{ name: "EV Charging", score: 77, change30d: 8.9 }, { name: "Bidirectional Charging", score: 81, change30d: 1.8 }, { name: "Vehicle to Everything", score: 75, change30d: 0.5 }, { name: "Energy Management Systems", score: 50, change30d: -2.5 }, { name: "Smart City", score: 41, change30d: -1.2 }] },
  { id: "ev-charging", name: "EV Charging", shortName: "Charging", domain: "energy-power", color: "#AFA9EC", base: [3, 8, 14, 19], quadrant: "qw", topDriver: "Investments", driverPct: 64, maturity: "Growing", description: "Public, depot and ultra-fast charging infrastructure plus onboard charger tech.", change30d: 3.9, history: history(72, 14), companies: 670, investment: 21600, employees: 78000, subtechs: [{ name: "Electric Mobility", score: 88, change30d: 1.2 }, { name: "Software Defined Vehicle", score: 98, change30d: 2.5 }, { name: "Vehicle to Grid", score: 76, change30d: -0.4 }, { name: "Bidirectional Charging", score: 70, change30d: 6.7 }, { name: "Vehicle to Everything", score: 76, change30d: 1.4 }] },
  { id: "ad", name: "Autonomous Driving", shortName: "AD", domain: "autonomy-intelligence", color: "#185FA5", base: [7, 15, 24, 32], quadrant: "bb", topDriver: "Investments", driverPct: 72, maturity: "Growing", description: "L2+ to L4 stacks across robotaxis, trucking and consumer ADAS programs.", change30d: 5.8, history: history(82, 20), companies: 410, investment: 52900, employees: 96000, subtechs: [{ name: "Software Defined Vehicle", score: 91, change30d: 8.5 }, { name: "Smart Logistics", score: 52, change30d: -2.9 }, { name: "Smart City", score: 50, change30d: -3.8 }, { name: "Electric Vehicle", score: 51, change30d: -0.3 }, { name: "Fleet Management", score: 49, change30d: 1.4 }] },
  { id: "sensor-fusion", name: "Sensor Fusion", shortName: "Fusion", domain: "autonomy-intelligence", color: "#BA7517", base: [2, 5, 10, 14], quadrant: "qw", topDriver: "Patents", driverPct: 60, maturity: "Growing", description: "Combining camera, radar, lidar and HD-map data into a robust perception layer.", change30d: 2.7, history: history(64, 10), companies: 145, investment: 4200, employees: 18000, subtechs: [] },
  { id: "av-software", name: "AV Software", shortName: "AV SW", domain: "autonomy-intelligence", color: "#D4537E", base: [4, 11, 19, 26], quadrant: "bb", topDriver: "Research", driverPct: 66, maturity: "Emerging", description: "Planning, prediction and end-to-end neural stacks for autonomous mobility.", change30d: 4.6, history: history(74, 16), companies: 220, investment: 14300, employees: 32000, subtechs: [{ name: "Vehicle to Grid", score: 49, change30d: 7.2 }, { name: "Vehicle Safety", score: 49, change30d: -3.3 }, { name: "Battery Management Systems", score: 51, change30d: 6.1 }, { name: "Software Defined Vehicle", score: 51, change30d: 4.8 }, { name: "AV Simulation", score: 46, change30d: 1.1 }] },
];

export function getTechById(id: string): Technology | undefined {
  return TECHS.find((t) => t.id === id);
}
export function getTechsByQuadrant(q: Quadrant): Technology[] {
  return TECHS.filter((t) => t.quadrant === q);
}
export function getTechsByDomain(d: DomainId): Technology[] {
  return TECHS.filter((t) => t.domain === d);
}
export function getQuadrantMeta(q: Quadrant): QuadrantMeta {
  return QUADRANTS_META.find((m) => m.id === q)!;
}
export function getDomain(id: DomainId): Domain | undefined {
  return DOMAINS.find((d) => d.id === id);
}
export function getSignalScore(t: Technology): number {
  const v = t.base[t.base.length - 1];
  return Math.max(0, Math.min(100, Math.round(50 + v * 1.6)));
}
export function getQuadrantSignal(techs: Technology[]): number {
  if (techs.length === 0) return 0;
  const avg = techs.reduce((s, t) => s + Math.abs(t.base[t.base.length - 1]), 0) / techs.length;
  return Math.max(0, Math.min(100, Math.round(avg * 3)));
}
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export const RELATIONSHIPS: Array<{ id: string; source: string; target: string; type: "requires" | "enables" | "co-occurs" | "depends-on" | "interoperability"; note: string }> = [
  { id: "r1", source: "sdv", target: "ad", type: "enables", note: "SDV stacks unlock AD pilots through OTA updates and zonal compute." },
  { id: "r2", source: "ad", target: "sensor-fusion", type: "requires", note: "AD relies on multi-modal sensor fusion for safe perception." },
  { id: "r3", source: "ad", target: "av-software", type: "depends-on", note: "AD progress is bound to maturation of AV software stacks." },
  { id: "r4", source: "v2g", target: "ev-charging", type: "requires", note: "V2G needs bidirectional charging infrastructure." },
  { id: "r5", source: "v2g", target: "v2x", type: "interoperability", note: "V2G shares messaging layers with broader V2X standards." },
  { id: "r6", source: "ev", target: "ev-battery", type: "requires", note: "Electric vehicles require advanced battery cells and packs." },
  { id: "r7", source: "ev", target: "bms", type: "requires", note: "EVs require Battery Management Systems for safety and range." },
  { id: "r8", source: "bms", target: "ems", type: "co-occurs", note: "BMS and EMS evolve together in modern e-powertrains." },
  { id: "r9", source: "ev-charging", target: "ev", type: "enables", note: "Charging density directly enables EV adoption rates." },
  { id: "r10", source: "sdv", target: "av-software", type: "enables", note: "SDV runtimes are the foundation for AV software deployment." },
  { id: "r11", source: "v2x", target: "ad", type: "enables", note: "V2X provides cooperative perception for AD." },
  { id: "r12", source: "ev-battery", target: "bms", type: "depends-on", note: "Battery chemistry choices constrain BMS design." },
];
