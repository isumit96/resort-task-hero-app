import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import "./i18n/config";
import { useEffect } from "react";

// Import all page components
import Login from "./pages/Login";
import TaskList from "./pages/TaskList";
import TaskDetail from "./pages/TaskDetail";
import TaskHistory from "./pages/TaskHistory";
import ManagerDashboard from "./pages/ManagerDashboard";
import TaskCreate from "./pages/TaskCreate";
import Settings from "./pages/Settings";
import TemplateList from "./pages/TemplateList";
import TemplateDetail from "./pages/TemplateDetail";
import TemplateEdit from "./pages/TemplateEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useUser();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/tasks" /> : <Login />} />
      <Route path="/tasks" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
      <Route path="/task/:taskId" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><TaskHistory /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute><ManagerDashboard /></ProtectedRoute>} />
      <Route path="/tasks/create" element={<ProtectedRoute><TaskCreate /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/templates" element={<ProtectedRoute><TemplateList /></ProtectedRoute>} />
      <Route path="/templates/:templateId" element={<ProtectedRoute><TemplateDetail /></ProtectedRoute>} />
      <Route path="/templates/edit/:templateId" element={<ProtectedRoute><TemplateEdit /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Initialize language from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng');
    if (savedLang) {
      import('i18next').then(i18next => {
        if (i18next.default.language !== savedLang) {
          i18next.default.changeLanguage(savedLang);
        }
      });
    }
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <div className="bg-background min-h-screen text-foreground">
            <Toaster />
            <Sonner />
            <AppRoutes />
          </div>
        </UserProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
