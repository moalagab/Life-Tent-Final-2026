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
import { useTheme } from "@/hooks/useTheme";

// Lazy-load all pages — nothing is eagerly bundled into the critical path
const LandingPage     = lazy(() => import("./pages/LandingPage"));
const Auth            = lazy(() => import("./pages/Auth"));
const ResetPassword   = lazy(() => import("./pages/ResetPassword"));
const NotFound        = lazy(() => import("./pages/NotFound"));
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
  const { theme } = useTheme();

  // Back button + app resume handling
  useAppLifecycle(() => {
    queryClient.invalidateQueries();
  });

  // Hide splash screen on first render
  useEffect(() => {
    if (!isNative) return;
    import('@capacitor/splash-screen').then(({ SplashScreen }) =>
      SplashScreen.hide({ fadeOutDuration: 300 })
    ).catch(() => {});
  }, []);

  // Sync StatusBar style + background with current theme
  useEffect(() => {
    if (!isNative) return;
    import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
      if (theme === 'dark') {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setBackgroundColor({ color: '#0B1733' });
      } else {
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor({ color: '#F4F5F8' });
      }
    }).catch(() => {});
  }, [theme]);

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
