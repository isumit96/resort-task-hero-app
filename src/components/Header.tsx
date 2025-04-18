import { ArrowLeft, Settings, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
}

const Header = ({ title, showBackButton = false, showSettings = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const getPageTitle = (): string => {
    if (title) return title;
    
    switch (location.pathname) {
      case "/":
        return "Login";
      case "/tasks":
        return "Today's Tasks";
      case "/history":
        return "Task History";
      case "/settings":
        return "Settings";
      default:
        if (location.pathname.includes("/task/")) {
          return "Task Details";
        }
        return "Resort Tasks";
    }
  };

  const isTasksPage = location.pathname === "/tasks";
  const paths = location.pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md shadow-sm border-b border-border/40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button 
              onClick={handleBack}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
          )}
          
          <div>
            <h1 className="font-semibold text-xl text-foreground">{getPageTitle()}</h1>
            {paths.length > 1 && (
              <div className="hidden md:flex text-sm text-muted-foreground space-x-1 mt-0.5">
                {paths.map((path, i) => (
                  <div key={i} className="flex items-center">
                    {i > 0 && <span className="mx-1 text-muted-foreground/60">/</span>}
                    <span className={cn(
                      i === paths.length - 1 ? "font-medium text-accent-foreground" : "text-muted-foreground"
                    )}>
                      {path.charAt(0).toUpperCase() + path.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
