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
import { LightboxProvider } from "@/components/lightbox/LightboxProvider";
import { PageViewTracker } from "@/components/PageViewTracker";

/**
 * PlatformInit — sets data-platform on <html> so CSS tokens apply.
 *   "fluent" → Fluent UI 2  (desktop web, ≥768 px)
 *   "hig"    → Apple HIG    (mobile web + native iOS/Android)
 */
function PlatformInit() {
  useEffect(() => {
    const apply = () => {
      const platform = (isNative || window.innerWidth < 768) ? 'hig' : 'fluent';
      document.documentElement.setAttribute('data-platform', platform);
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}

// Lazy-load all pages — nothing is eagerly bundled into the critical path
const LandingPage     = lazy(() => import("./pages/LandingPage"));
const Auth            = lazy(() => import("./pages/Auth"));
const ResetPassword   = lazy(() => import("./pages/ResetPassword"));
const NotFound        = lazy(() => import("./pages/NotFound"));
const TermsOfService  = lazy(() => import("./pages/legal/TermsOfService"));
const PrivacyPolicy   = lazy(() => import("./pages/legal/PrivacyPolicy"));
const RefundPolicy    = lazy(() => import("./pages/legal/RefundPolicy"));
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
const Settings      = lazy(() => import("./pages/Settings"));
const Profile       = lazy(() => import("./pages/Profile"));
const AreaWorkspace       = lazy(() => import("./pages/AreaWorkspace"));
const ProjectWorkspace    = lazy(() => import("./pages/ProjectWorkspace"));
const GoalWorkspace       = lazy(() => import("./pages/GoalWorkspace"));
const FinanceWorkspace    = lazy(() => import("./pages/FinanceWorkspace"));
const HabitDetail         = lazy(() => import("./pages/HabitDetail"));
const TaskWorkspace       = lazy(() => import("./pages/TaskWorkspace"));
const NoteWorkspace       = lazy(() => import("./pages/NoteWorkspace"));
const MediaItemWorkspace  = lazy(() => import("./pages/MediaItemWorkspace"));
const ResourceWorkspace   = lazy(() => import("./pages/ResourceWorkspace"));
const ArchivePage         = lazy(() => import("./pages/ArchivePage"));
const Timeline            = lazy(() => import("./pages/Timeline"));
const GraphPage           = lazy(() => import("./pages/GraphPage"));

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
        StatusBar.setBackgroundColor({ color: '#131C32' });
      } else {
        StatusBar.setStyle({ style: Style.Light });
        StatusBar.setBackgroundColor({ color: '#E6EBF7' });
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
          <LightboxProvider>
          <PlatformInit />
          <NativeBootstrap />
          <Toaster />
          <Sonner />
          <PWAUpdatePrompt />
          <BrowserRouter>
            <PageViewTracker />
            <OnboardingProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                     element={<LandingPage />} />
                <Route path="/welcome"              element={<LandingPage />} />
                <Route path="/auth"                 element={<Auth />} />
                <Route path="/auth/reset-password"  element={<ResetPassword />} />
                <Route path="/terms"                element={<TermsOfService />} />
                <Route path="/privacy"              element={<PrivacyPolicy />} />
                <Route path="/refund"               element={<RefundPolicy />} />

                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route path="/admin"      element={<ProtectedRoute><AdminGuard><AdminDashboard /></AdminGuard></ProtectedRoute>} />
                <Route path="/dashboard"  element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/projects"   element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                <Route path="/tasks"      element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
                <Route path="/tasks/:id"  element={<ProtectedRoute><TaskWorkspace /></ProtectedRoute>} />
                <Route path="/goals"      element={<ProtectedRoute><Goals /></ProtectedRoute>} />
                <Route path="/finance"    element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/knowledge"         element={<ProtectedRoute><Knowledge /></ProtectedRoute>} />
                <Route path="/knowledge/notes/:id" element={<ProtectedRoute><NoteWorkspace /></ProtectedRoute>} />
                <Route path="/habits"     element={<ProtectedRoute><Habits /></ProtectedRoute>} />
                <Route path="/calendar"   element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                <Route path="/studio"     element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                <Route path="/pomodoro"   element={<ProtectedRoute><Pomodoro /></ProtectedRoute>} />
                <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/areas/:id"     element={<ProtectedRoute><AreaWorkspace /></ProtectedRoute>} />
                <Route path="/projects/:id" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
                <Route path="/goals/:id"    element={<ProtectedRoute><GoalWorkspace /></ProtectedRoute>} />
                <Route path="/habits/:id"   element={<ProtectedRoute><HabitDetail /></ProtectedRoute>} />
                <Route path="/studio/:id"   element={<ProtectedRoute><MediaItemWorkspace /></ProtectedRoute>} />
                <Route path="/resources/:id" element={<ProtectedRoute><ResourceWorkspace /></ProtectedRoute>} />
                <Route path="/finance/workspace" element={<ProtectedRoute><FinanceWorkspace /></ProtectedRoute>} />
                <Route path="/finance/:section" element={<ProtectedRoute><Finance /></ProtectedRoute>} />
                <Route path="/archive"      element={<ProtectedRoute><ArchivePage /></ProtectedRoute>} />
                <Route path="/timeline"    element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
                <Route path="/graph"      element={<ProtectedRoute><GraphPage /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            </OnboardingProvider>
          </BrowserRouter>
          </LightboxProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
