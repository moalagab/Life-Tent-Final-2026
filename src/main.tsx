import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./hooks/useTheme";
import { initMonitoring } from "./lib/monitoring";

// Start monitoring (Web Vitals observer + optional external adapter)
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
