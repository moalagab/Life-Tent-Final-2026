import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { OnboardingProvider } from "@/hooks/useOnboarding";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/queryClient";
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { isNative } from "@/lib/capacitor";

// Eagerly load auth pages (always needed)
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy-load all protected pages — splits each into its own chunk
const Onboarding      = lazy(() => import("./pages/Onboarding"));
const AdminDashboard  = lazy(() => import("./pages/admin/AdminDashboard"));
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

/** Initialises native plugins once on app start */
function NativeBootstrap() {
  // Back button + app resume handling
  useAppLifecycle(() => {
    queryClient.invalidateQueries();
  });

  // Hide splash screen + set status bar after first render
  useEffect(() => {
    if (!isNative) return;

    Promise.all([
      import('@capacitor/splash-screen').then(({ SplashScreen }) =>
        SplashScreen.hide({ fadeOutDuration: 300 })),
      import('@capacitor/status-bar').then(({ StatusBar, Style }) =>
        StatusBar.setStyle({ style: Style.Dark })),
    ]).catch(() => {});
  }, []);

  return null;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <NativeBootstrap />
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <OnboardingProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                     element={<LandingPage />} />
                <Route path="/welcome"              element={<LandingPage />} />
                <Route path="/auth"                 element={<Auth />} />
                <Route path="/auth/reset-password"  element={<ResetPassword />} />

                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/admin"      element={<ProtectedRoute><AdminGuard><AdminDashboard /></AdminGuard></ProtectedRoute>} />
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
            </OnboardingProvider>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
