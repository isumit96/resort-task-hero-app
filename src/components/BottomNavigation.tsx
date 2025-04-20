
import { Settings, ListChecks, History, ClipboardEdit } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";
import { memo, useState } from "react";

const BottomNavigation = memo(() => {
  const { isManager } = useRole();
  const [touchedItem, setTouchedItem] = useState<string | null>(null);
  
  const handleTouchStart = (item: string) => {
    setTouchedItem(item);
  };
  
  const handleTouchEnd = () => {
    setTouchedItem(null);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 border-t bg-background flex items-center justify-around px-4 z-10 safe-area-bottom">
      <NavLink
        to="/tasks"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center space-y-1 text-sm",
            isActive ? "text-primary" : "text-muted-foreground",
            touchedItem === "tasks" ? "opacity-70 scale-95" : ""
          )
        }
        onTouchStart={() => handleTouchStart("tasks")}
        onTouchEnd={handleTouchEnd}
      >
        <ListChecks className="h-5 w-5" />
        <span>Tasks</span>
      </NavLink>
      
      <NavLink
        to="/history"
        className={({ isActive }) =>
          cn(
            "flex flex-col items-center justify-center space-y-1 text-sm",
            isActive ? "text-primary" : "text-muted-foreground",
            touchedItem === "history" ? "opacity-70 scale-95" : ""
          )
        }
        onTouchStart={() => handleTouchStart("history")}
        onTouchEnd={handleTouchEnd}
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
              isActive ? "text-primary" : "text-muted-foreground",
              touchedItem === "manager" ? "opacity-70 scale-95" : ""
            )
          }
          onTouchStart={() => handleTouchStart("manager")}
          onTouchEnd={handleTouchEnd}
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
            isActive ? "text-primary" : "text-muted-foreground",
            touchedItem === "settings" ? "opacity-70 scale-95" : ""
          )
        }
        onTouchStart={() => handleTouchStart("settings")}
        onTouchEnd={handleTouchEnd}
      >
        <Settings className="h-5 w-5" />
        <span>Settings</span>
      </NavLink>
    </div>
  );
});

BottomNavigation.displayName = "BottomNavigation";

export default BottomNavigation;
