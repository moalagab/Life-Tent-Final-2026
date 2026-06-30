import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasStarted = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const completeOAuth = async () => {
      const code = new URLSearchParams(window.location.search).get("code");

      if (!code) {
        setErrorMessage("لم يصل رمز تسجيل الدخول من Google.");
        return;
      }

      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) throw error;

        if (!data.session) {
          throw new Error("لم يتم إنشاء جلسة دخول.");
        }

        window.history.replaceState({}, document.title, "/auth/callback");

        // Full reload so AuthProvider reads the new session from localStorage
        window.location.replace("/dashboard");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "فشل تحويل رمز Google إلى جلسة دخول.";

        console.error("[Google OAuth callback]", error);
        setErrorMessage(message);
      }
    };

    void completeOAuth();
  }, []);

  if (errorMessage) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-bold">تعذر إكمال تسجيل الدخول</h1>
          <p className="text-muted-foreground break-words">{errorMessage}</p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">جارٍ إكمال تسجيل الدخول…</p>
    </main>
  );
}
