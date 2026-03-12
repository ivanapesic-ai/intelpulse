import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/mockups/Dashboard";
import TechnologyExplorer from "./pages/mockups/TechnologyExplorer";
import AdminPanel from "./pages/mockups/AdminPanel";
import PublicDemo from "./pages/mockups/PublicDemo";
import IntelligenceDashboard from "./pages/mockups/IntelligenceDashboard";
import KnowledgeGraphPage from "./pages/mockups/KnowledgeGraphPage";
import MySignals from "./pages/mockups/MySignals";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
            {/* Public */}
            <Route path="/" element={<PublicDemo />} />
            <Route path="/login" element={<Login />} />
              
              {/* Authenticated Users */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/explorer" element={
                <ProtectedRoute>
                  <TechnologyExplorer />
                </ProtectedRoute>
              } />
              <Route path="/intelligence" element={
                <ProtectedRoute>
                  <IntelligenceDashboard />
                </ProtectedRoute>
              } />
              <Route path="/knowledge-graph" element={
                <ProtectedRoute>
                  <KnowledgeGraphPage />
                </ProtectedRoute>
              } />
              
              {/* Admin Only */}
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
