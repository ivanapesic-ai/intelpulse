import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/mockups/Dashboard";
import TechnologyExplorer from "./pages/mockups/TechnologyExplorer";
import AdminPanel from "./pages/mockups/AdminPanel";
import PublicDemo from "./pages/mockups/PublicDemo";
import IntelligenceDashboard from "./pages/mockups/IntelligenceDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/demo" element={<PublicDemo />} />
            
            {/* Authenticated Users */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/explorer" element={<TechnologyExplorer />} />
            <Route path="/intelligence" element={<IntelligenceDashboard />} />
            
            {/* Admin Only */}
            <Route path="/admin" element={<AdminPanel />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
