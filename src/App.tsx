
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import TaskList from "./pages/TaskList";
import TaskDetail from "./pages/TaskDetail";
import TaskCreate from "./pages/TaskCreate";
import TaskHistory from "./pages/TaskHistory";
import TemplateList from "./pages/TemplateList";
import TemplateDetail from "./pages/TemplateDetail";
import TemplateEdit from "./pages/TemplateEdit";
import ManagerDashboard from "./pages/ManagerDashboard";
import { UserProvider } from "./context/UserContext";
import { Toaster } from "./components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/tasks/:taskId" element={<TaskDetail />} />
            <Route path="/tasks/create" element={<TaskCreate />} />
            <Route path="/history" element={<TaskHistory />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/templates" element={<TemplateList />} />
            <Route path="/templates/:templateId" element={<TemplateDetail />} />
            <Route path="/templates/edit/:templateId" element={<TemplateEdit />} />
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
