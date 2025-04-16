
import { ArrowLeft, LogOut, ClipboardList, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  showLogout?: boolean;
}

const Header = ({ title, showBackButton = false, showLogout = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useUser();

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
          <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
        </div>
        
        {showLogout && (
          <button 
            onClick={handleLogout}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
