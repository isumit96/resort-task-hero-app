import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Settings } from "lucide-react";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
}

const Header = ({ title, showBackButton = false, showSettings = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

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

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <button 
              onClick={handleBack}
              className="mr-3 p-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          {location.pathname === "/tasks" && user && (
            <div>
              <h1 className="text-xl font-semibold">Hello, {user.email?.split('@')[0] || "User"}</h1>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}</p>
            </div>
          )}
          {location.pathname !== "/tasks" && (
            <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
          )}
        </div>
        
        {showSettings && location.pathname === "/tasks" && (
          <button 
            onClick={handleSettings}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
