
import { Settings, ListChecks, History, ClipboardEdit } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const { isManager } = useRole();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background flex items-center justify-around px-4 z-10">
      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center space-y-1 text-sm",
            isActive ? "text-primary" : "text-muted-foreground"
          )
        }
      >
        <ListChecks className="h-5 w-5" />
        <span>Tasks</span>
      </NavLink>
      
      <NavLink
        to="/history"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center space-y-1 text-sm",
            isActive ? "text-primary" : "text-muted-foreground"
          )
        }
      >
        <History className="h-5 w-5" />
        <span>History</span>
      </NavLink>
      
      {isManager && (
        <NavLink
          to="/manager"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center space-y-1 text-sm",
              isActive ? "text-primary" : "text-muted-foreground"
            )
          }
        >
          <ClipboardEdit className="h-5 w-5" />
          <span>Dashboard</span>
        </NavLink>
      )}
      
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center space-y-1 text-sm",
            isActive ? "text-primary" : "text-muted-foreground"
          )
        }
      >
        <Settings className="h-5 w-5" />
        <span>Settings</span>
      </NavLink>
    </div>
  );
};

export default BottomNavigation;
