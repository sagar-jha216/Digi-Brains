import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Generate from "@/pages/Generate";
import Videos from "@/pages/Videos";
import Products from "@/pages/Products";
import Schedule from "@/pages/Schedule";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Guard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"           element={<Navigate to="/auth" replace />} />
      <Route path="/auth"       element={<Auth />} />
      <Route path="/dashboard"  element={<Guard><Dashboard /></Guard>} />
      <Route path="/generate"   element={<Guard><Generate /></Guard>} />
      <Route path="/videos"     element={<Guard><Videos /></Guard>} />
      <Route path="/products"   element={<Guard><Products /></Guard>} />
      <Route path="/schedule"   element={<Guard><Schedule /></Guard>} />
      <Route path="/analytics"  element={<Guard><Analytics /></Guard>} />
      <Route path="/settings"   element={<Guard><Settings /></Guard>} />
      <Route path="*"           element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
