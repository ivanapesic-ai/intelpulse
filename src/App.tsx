import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MockupsIndex from "./pages/mockups/index";
import Dashboard from "./pages/mockups/Dashboard";
import TechnologyRadar from "./pages/mockups/TechnologyRadar";
import HeatmapMatrix from "./pages/mockups/HeatmapMatrix";
import TechnologyExplorer from "./pages/mockups/TechnologyExplorer";
import AdminPanel from "./pages/mockups/AdminPanel";
import PublicDemo from "./pages/mockups/PublicDemo";
import ArchitectureDiagrams from "./pages/mockups/ArchitectureDiagrams";
import AnnexA from "./pages/mockups/AnnexA";
import AnnexB from "./pages/mockups/AnnexB";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mockups" element={<MockupsIndex />} />
          <Route path="/mockups/dashboard" element={<Dashboard />} />
          <Route path="/mockups/radar" element={<TechnologyRadar />} />
          <Route path="/mockups/heatmap" element={<HeatmapMatrix />} />
          <Route path="/mockups/explorer" element={<TechnologyExplorer />} />
          <Route path="/mockups/admin" element={<AdminPanel />} />
          <Route path="/mockups/public" element={<PublicDemo />} />
          <Route path="/mockups/architecture" element={<ArchitectureDiagrams />} />
          <Route path="/mockups/annex-a" element={<AnnexA />} />
          <Route path="/mockups/annex-b" element={<AnnexB />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
