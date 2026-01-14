import { Link } from "react-router-dom";
import { ArrowLeft, Database, MapPin, TrendingUp, Users, Lightbulb, Network, Newspaper, HandshakeIcon, Globe, CheckCircle2, Star, Minus, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface ApiField {
  field: string;
  description: string;
  used: boolean;
  relevant: boolean;
  priority: "high" | "medium" | "low";
  notes: string;
}

interface Category {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  fields: ApiField[];
}

const categories: Category[] = [
  {
    id: "core",
    title: "Company Core Information",
    icon: Database,
    description: "Basic company identification and descriptive data",
    fields: [
      { field: "id", description: "Unique Dealroom company identifier", used: true, relevant: true, priority: "high", notes: "Primary key for mapping and deduplication" },
      { field: "name", description: "Company name", used: true, relevant: true, priority: "high", notes: "Display and search functionality" },
      { field: "tagline", description: "Short company description/slogan", used: true, relevant: true, priority: "high", notes: "Quick company overview" },
      { field: "description", description: "Full company description", used: true, relevant: true, priority: "high", notes: "Detailed company analysis" },
      { field: "website", description: "Company website URL", used: true, relevant: true, priority: "high", notes: "External reference and validation" },
      { field: "logo_url", description: "Company logo image URL", used: false, relevant: true, priority: "medium", notes: "Visual identification in UI" },
      { field: "launch_date", description: "Product/service launch date", used: false, relevant: true, priority: "medium", notes: "Technology maturity assessment" },
      { field: "status", description: "Company status (active, closed, acquired)", used: false, relevant: true, priority: "medium", notes: "Filter out inactive companies" },
    ]
  },
  {
    id: "location",
    title: "Location & Geography",
    icon: MapPin,
    description: "Headquarters and operational presence across regions",
    fields: [
      { field: "hq_locations", description: "Headquarters location (city, country)", used: true, relevant: true, priority: "high", notes: "EU-focused filtering" },
      { field: "regions", description: "Geographic regions of operation", used: false, relevant: true, priority: "medium", notes: "Regional analysis and heatmap" },
      { field: "operational_locations", description: "All locations where company operates", used: false, relevant: true, priority: "medium", notes: "EU market penetration analysis" },
    ]
  },
  {
    id: "funding",
    title: "Funding & Financials",
    icon: TrendingUp,
    description: "Investment rounds, valuations, and financial metrics",
    fields: [
      { field: "total_funding", description: "Total funding raised (EUR)", used: true, relevant: true, priority: "high", notes: "Investment score calculation" },
      { field: "valuation", description: "Latest company valuation (EUR)", used: true, relevant: true, priority: "high", notes: "Market confidence indicator" },
      { field: "last_funding_date", description: "Date of most recent funding round", used: true, relevant: true, priority: "high", notes: "Recent activity signal" },
      { field: "last_funding_amount", description: "Amount raised in last round (EUR)", used: true, relevant: true, priority: "high", notes: "Growth trajectory indicator" },
      { field: "growth_stage", description: "Company stage (seed, series A, etc.)", used: true, relevant: true, priority: "high", notes: "Technology maturity mapping" },
      { field: "funding_rounds[]", description: "Detailed funding round history", used: false, relevant: true, priority: "high", notes: "Trend analysis over time" },
      { field: "revenue", description: "Annual revenue (if available)", used: false, relevant: false, priority: "low", notes: "Often not disclosed" },
      { field: "revenue_model", description: "Business model type", used: false, relevant: false, priority: "low", notes: "Limited relevance for tech tracking" },
    ]
  },
  {
    id: "employment",
    title: "Employment & Growth",
    icon: Users,
    description: "Workforce size, growth trends, and hiring activity",
    fields: [
      { field: "employees", description: "Current employee count", used: true, relevant: true, priority: "high", notes: "Employees score calculation" },
      { field: "employee_growth", description: "Employee growth rate (%)", used: false, relevant: true, priority: "high", notes: "Trend detection - growing vs declining" },
      { field: "jobs_count", description: "Number of open job positions", used: false, relevant: true, priority: "high", notes: "Hiring activity = growth signal" },
      { field: "employee_history[]", description: "Historical employee counts", used: false, relevant: true, priority: "medium", notes: "Growth trajectory analysis" },
    ]
  },
  {
    id: "technology",
    title: "Technology & Innovation",
    icon: Lightbulb,
    description: "Industry classifications, technology tags, and IP data",
    fields: [
      { field: "industries", description: "Industry classifications/tags", used: true, relevant: true, priority: "high", notes: "Technology categorization" },
      { field: "technologies", description: "Technology stack/tags", used: false, relevant: true, priority: "high", notes: "Deeper technology classification" },
      { field: "patents_count", description: "Number of patents held", used: true, relevant: true, priority: "high", notes: "Patents score calculation" },
      { field: "sub_industries", description: "More specific industry tags", used: false, relevant: true, priority: "medium", notes: "Fine-grained categorization" },
    ]
  },
  {
    id: "investors",
    title: "Investors & Network",
    icon: Network,
    description: "Investor relationships, founders, and board members",
    fields: [
      { field: "investors", description: "List of all investors", used: true, relevant: true, priority: "high", notes: "Key players identification" },
      { field: "lead_investors", description: "Lead investors per round", used: false, relevant: true, priority: "medium", notes: "Major backer analysis" },
      { field: "founders", description: "Founder names and details", used: false, relevant: false, priority: "low", notes: "Less relevant for tech tracking" },
      { field: "board_members", description: "Board composition", used: false, relevant: false, priority: "low", notes: "Less relevant for tech tracking" },
    ]
  },
  {
    id: "media",
    title: "Media & News",
    icon: Newspaper,
    description: "Recent news, press coverage, and announcements",
    fields: [
      { field: "news", description: "Recent news articles about company", used: true, relevant: true, priority: "high", notes: "Signal detection and alerts" },
      { field: "press_mentions", description: "Press mention count", used: false, relevant: true, priority: "medium", notes: "Visibility/traction indicator" },
      { field: "awards", description: "Awards and recognitions", used: false, relevant: false, priority: "low", notes: "Nice to have but not critical" },
    ]
  },
  {
    id: "deals",
    title: "Deals & M&A",
    icon: HandshakeIcon,
    description: "Acquisitions, mergers, and exit events",
    fields: [
      { field: "acquisitions", description: "Companies acquired by this company", used: false, relevant: false, priority: "low", notes: "Market consolidation tracking" },
      { field: "acquired_by", description: "If acquired, by whom", used: false, relevant: false, priority: "low", notes: "Exit tracking" },
      { field: "ipo_date", description: "IPO date if applicable", used: false, relevant: false, priority: "low", notes: "Public company tracking" },
    ]
  },
  {
    id: "social",
    title: "Social & Digital Presence",
    icon: Globe,
    description: "Social media profiles and online presence",
    fields: [
      { field: "linkedin_url", description: "LinkedIn company page", used: false, relevant: false, priority: "low", notes: "External validation" },
      { field: "twitter_url", description: "Twitter/X profile", used: false, relevant: false, priority: "low", notes: "Social signals" },
      { field: "crunchbase_url", description: "Crunchbase profile link", used: false, relevant: false, priority: "low", notes: "Cross-reference data" },
      { field: "github_url", description: "GitHub organization", used: false, relevant: true, priority: "medium", notes: "Open source activity" },
    ]
  },
];

const StatusBadge = ({ used, priority }: { used: boolean; priority: "high" | "medium" | "low" }) => {
  if (used) {
    return (
      <Badge variant="default" className="bg-green-500/20 text-green-600 border-green-500/30 gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Currently Used
      </Badge>
    );
  }
  if (priority === "high") {
    return (
      <Badge variant="secondary" className="bg-blue-500/20 text-blue-600 border-blue-500/30 gap-1">
        <Star className="h-3 w-3" />
        Recommended
      </Badge>
    );
  }
  if (priority === "medium") {
    return (
      <Badge variant="outline" className="text-amber-600 border-amber-500/30 gap-1">
        <Star className="h-3 w-3" />
        Phase 2
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground gap-1">
      <Minus className="h-3 w-3" />
      Low Priority
    </Badge>
  );
};

const RelevanceBadge = ({ relevant }: { relevant: boolean }) => {
  return relevant ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <Minus className="h-4 w-4 text-muted-foreground" />
  );
};

export default function DealroomApiParams() {
  // Calculate statistics
  const allFields = categories.flatMap(c => c.fields);
  const usedFields = allFields.filter(f => f.used);
  const highPriorityNotUsed = allFields.filter(f => !f.used && f.priority === "high");
  const mediumPriorityNotUsed = allFields.filter(f => !f.used && f.priority === "medium");
  const lowPriorityFields = allFields.filter(f => f.priority === "low");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/mockups" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Mockups
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-xl font-bold">Dealroom API Parameters</h1>
              <p className="text-sm text-muted-foreground">Data fields available for technology tracking</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Statistics Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              API Coverage Summary
            </CardTitle>
            <CardDescription>
              Overview of Dealroom API parameters and their implementation status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-foreground">{allFields.length}</div>
                <div className="text-sm text-muted-foreground">Total Fields</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-3xl font-bold text-green-600">{usedFields.length}</div>
                <div className="text-sm text-green-600/80">Currently Used</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-600">{highPriorityNotUsed.length}</div>
                <div className="text-sm text-blue-600/80">High Priority Additions</div>
              </div>
              <div className="text-center p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-600">{mediumPriorityNotUsed.length}</div>
                <div className="text-sm text-amber-600/80">Phase 2 Candidates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Methodology Alignment */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Alignment with Scoring Methodology</CardTitle>
            <CardDescription>
              How Dealroom parameters map to our composite scoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-blue-600 mb-2">Investment Score</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> total_funding</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> valuation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> last_funding_amount</li>
                  <li className="flex items-center gap-2"><Star className="h-3 w-3 text-blue-500" /> funding_rounds[]</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-green-600 mb-2">Employees Score</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> employees</li>
                  <li className="flex items-center gap-2"><Star className="h-3 w-3 text-blue-500" /> employee_growth</li>
                  <li className="flex items-center gap-2"><Star className="h-3 w-3 text-blue-500" /> jobs_count</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-purple-600 mb-2">Patents Score</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> patents_count</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-amber-600 mb-2">Trend Detection</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> last_funding_date</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> news</li>
                  <li className="flex items-center gap-2"><Star className="h-3 w-3 text-blue-500" /> employee_growth</li>
                  <li className="flex items-center gap-2"><Star className="h-3 w-3 text-blue-500" /> jobs_count</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Currently implemented</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 text-blue-500" /> Recommended addition</span>
            </div>
          </CardContent>
        </Card>

        {/* Category Tables */}
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-primary" />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Field</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[150px]">Status</TableHead>
                      <TableHead className="w-[80px] text-center">Relevant</TableHead>
                      <TableHead className="w-[250px]">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.fields.map((field) => (
                      <TableRow key={field.field}>
                        <TableCell className="font-mono text-sm">{field.field}</TableCell>
                        <TableCell className="text-muted-foreground">{field.description}</TableCell>
                        <TableCell>
                          <StatusBadge used={field.used} priority={field.priority} />
                        </TableCell>
                        <TableCell className="text-center">
                          <RelevanceBadge relevant={field.relevant} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{field.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Implementation Priority */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recommended Implementation Priority</CardTitle>
            <CardDescription>
              Suggested order for adding new Dealroom parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-blue-600 mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Phase 1: High Priority (Immediate Value)
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {highPriorityNotUsed.map((field) => (
                    <div key={field.field} className="flex items-center gap-2 p-2 bg-blue-500/5 rounded border border-blue-500/20">
                      <code className="text-sm font-mono">{field.field}</code>
                      <span className="text-sm text-muted-foreground">— {field.notes}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-amber-600 mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Phase 2: Medium Priority (Enhanced Analysis)
                </h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {mediumPriorityNotUsed.map((field) => (
                    <div key={field.field} className="flex items-center gap-2 p-2 bg-amber-500/5 rounded border border-amber-500/20">
                      <code className="text-sm font-mono">{field.field}</code>
                      <span className="text-sm text-muted-foreground">— {field.notes}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Minus className="h-4 w-4" />
                  Low Priority (Future Consideration)
                </h4>
                <p className="text-sm text-muted-foreground">
                  {lowPriorityFields.map(f => f.field).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>AI-CE Heatmap Platform • Dealroom API Documentation</p>
          <p className="mt-1">Data sourced from Dealroom.co API v3</p>
        </div>
      </main>
    </div>
  );
}
