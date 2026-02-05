 import { Toaster } from "@/components/ui/toaster";
 import { Toaster as Sonner } from "@/components/ui/sonner";
 import { TooltipProvider } from "@/components/ui/tooltip";
 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
 import { BrowserRouter, Routes, Route } from "react-router-dom";
 import { ThemeProvider } from "@/components/ThemeProvider";
 
 // Production Pages
 import Login from "./pages/Login";
 import NotFound from "./pages/NotFound";
 
 // Legacy Mockups (to be migrated)
 import MockupsIndex from "./pages/mockups/index";
 import MockDashboard from "./pages/mockups/Dashboard";
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
     <ThemeProvider>
       <TooltipProvider>
         <Toaster />
         <Sonner />
         <BrowserRouter>
           <Routes>
             {/* ===== PRODUCTION ROUTES ===== */}
             <Route path="/" element={<Login />} />
             <Route path="/login" element={<Login />} />
             
             {/* Dashboard placeholder - will be built next */}
             <Route path="/dashboard" element={<MockDashboard />} />
             <Route path="/radar" element={<TechnologyRadar />} />
             <Route path="/heatmap" element={<HeatmapMatrix />} />
             <Route path="/explorer" element={<TechnologyExplorer />} />
             <Route path="/admin" element={<AdminPanel />} />
             
             {/* ===== LEGACY MOCKUPS (Temporary) ===== */}
             <Route path="/mockups" element={<MockupsIndex />} />
             <Route path="/mockups/dashboard" element={<MockDashboard />} />
             <Route path="/mockups/radar" element={<TechnologyRadar />} />
             <Route path="/mockups/heatmap" element={<HeatmapMatrix />} />
             <Route path="/mockups/explorer" element={<TechnologyExplorer />} />
             <Route path="/mockups/admin" element={<AdminPanel />} />
             <Route path="/mockups/public" element={<PublicDemo />} />
             <Route path="/mockups/architecture" element={<ArchitectureDiagrams />} />
             <Route path="/mockups/annex-a" element={<AnnexA />} />
             <Route path="/mockups/annex-b" element={<AnnexB />} />
             
             {/* Catch-all */}
             <Route path="*" element={<NotFound />} />
           </Routes>
         </BrowserRouter>
       </TooltipProvider>
     </ThemeProvider>
   </QueryClientProvider>
 );
 
 export default App;
