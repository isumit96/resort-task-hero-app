
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import TaskList from "./pages/TaskList";
import TaskDetail from "./pages/TaskDetail";
import TaskHistory from "./pages/TaskHistory";
import ManagerDashboard from "./pages/ManagerDashboard";
import TaskCreate from "./pages/TaskCreate";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Protected route wrapper
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
    // Redirect to login but remember where the user was trying to go
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
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <BrowserRouter>
        <div className="bg-background min-h-screen text-foreground">
          <Toaster />
          <Sonner />
          <AppRoutes />
        </div>
      </BrowserRouter>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
