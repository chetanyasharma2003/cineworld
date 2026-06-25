import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./context/ThemeContext";
import EmailVerifyBanner from "./components/EmailVerifyBanner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
      <AuthProvider>
        <EmailVerifyBanner />
        <ErrorBoundary>
        <App />
        </ErrorBoundary>
        {/* ✅ Global Toast Notifications */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1a1a1a",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontSize: "14px",
              padding: "12px 16px",
            },
            success: {
              iconTheme: { primary: "#e50914", secondary: "#fff" },
              style: {
                background: "#1a1a1a",
                border: "1px solid rgba(229,9,20,0.3)",
              },
            },
            error: {
              style: {
                background: "#1a1a1a",
                border: "1px solid rgba(229,9,20,0.5)",
              },
            },
          }}
        />
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
    </QueryClientProvider>
    </HelmetProvider>
  </React.StrictMode>
);