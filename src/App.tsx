import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";

// Eagerly load auth pages (always needed)
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy-load all protected pages — splits each into its own chunk
const Index        = lazy(() => import("./pages/Index"));
const Projects     = lazy(() => import("./pages/Projects"));
const Tasks        = lazy(() => import("./pages/Tasks"));
const Goals        = lazy(() => import("./pages/Goals"));
const Finance      = lazy(() => import("./pages/Finance"));
const Knowledge    = lazy(() => import("./pages/Knowledge"));
const Habits       = lazy(() => import("./pages/Habits"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const Studio       = lazy(() => import("./pages/Studio"));
const Pomodoro     = lazy(() => import("./pages/Pomodoro"));
const Settings     = lazy(() => import("./pages/Settings"));
const Profile      = lazy(() => import("./pages/Profile"));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                     element={<LandingPage />} />
                <Route path="/welcome"              element={<LandingPage />} />
                <Route path="/auth"                 element={<Auth />} />
                <Route path="/auth/reset-password"  element={<ResetPassword />} />

                <Route path="/dashboard"  element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/projects"   element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/tasks"      element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/goals"      element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                <Route path="/finance"    element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/knowledge"  element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
                <Route path="/habits"     element={<ProtectedRoute><Habits /></ProtectedRoute>} />
                <Route path="/calendar"   element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/studio"     element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                <Route path="/pomodoro"   element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
                <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
