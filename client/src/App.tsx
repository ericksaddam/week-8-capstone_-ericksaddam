import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "@/components/Dashboard";
import Tasks from "./pages/Tasks";
import Clubs from "./pages/Clubs";
import ClubDetailPage from "./pages/ClubDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import DiscoverClubs from "./pages/DiscoverClubs";
import Settings from "./pages/Settings";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequireAdmin } from "@/components/auth/RequireAdmin";
import { ConnectionProvider } from "@/contexts/ConnectionContext";
import { useConnection } from "@/hooks/useConnection";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2, // Retry failed queries 2 times before showing an error
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

import { AuthProvider } from "@/context/AuthContext";

// Connection status indicator component
const ConnectionStatus = () => {
  const { isOnline } = useConnection();
  
  if (isOnline) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-destructive-foreground animate-pulse"></div>
      <span>Offline - Trying to reconnect...</span>
    </div>
  );
}

// Wrapper component to conditionally render Navbar
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Don't show Navbar on these routes
  const hideNavbarPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
  const shouldShowNavbar = isAuthenticated && !hideNavbarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background">
      {shouldShowNavbar && <Navbar />}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

const App = () => (
  <ConnectionProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ConnectionStatus />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={
                <RequireAuth>
                  <AppLayout><Dashboard /></AppLayout>
                </RequireAuth>
              } />
              <Route path="/tasks" element={
                <RequireAuth>
                  <AppLayout><Tasks /></AppLayout>
                </RequireAuth>
              } />
              <Route path="/clubs" element={
                <RequireAuth>
                  <AppLayout><Clubs /></AppLayout>
                </RequireAuth>
              } />
              <Route path="/clubs/:clubId" element={
                <RequireAuth>
                  <AppLayout><ClubDetailPage /></AppLayout>
                </RequireAuth>
              } />
              <Route path="/admin/dashboard" element={
                <RequireAuth>
                  <RequireAdmin>
                    <AppLayout><AdminDashboardPage /></AppLayout>
                  </RequireAdmin>
                </RequireAuth>
              } />
              <Route path="/discover-clubs" element={
                <RequireAuth>
                  <AppLayout><DiscoverClubs /></AppLayout>
                </RequireAuth>
              } />
              <Route path="/settings" element={
                <RequireAuth>
                  <AppLayout><Settings /></AppLayout>
                </RequireAuth>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={
                <RequireAuth>
                  <RequireAdmin>
                    <AppLayout><AdminDashboard /></AppLayout>
                  </RequireAdmin>
                </RequireAuth>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ConnectionProvider>
);

export default App;
