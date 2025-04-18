import { Home, ClipboardCheck, Calendar, Bell, Menu, Settings } from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "@/context/UserContext";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isManager } = useRole();
  const { user } = useUser();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleManagerRedirect = () => {
    if (isManager) {
      navigate("/manager");
    }
  };

  const navItems = [
    {
      name: "Tasks",
      path: "/tasks",
      icon: <Home size={20} />
    },
    {
      name: "History",
      path: "/history",
      icon: <ClipboardCheck size={20} />
    },
    {
      name: "Dashboard",
      path: "/manager",
      icon: <Calendar size={20} />,
      isManagerOnly: true
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <Settings size={20} />
    }
  ];

  const filteredNavItems = navItems.filter(item => !item.isManagerOnly || isManager);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md border-t border-border/40 shadow-lg">
      <div className="max-w-2xl mx-auto flex justify-around">
        {filteredNavItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "relative flex flex-col items-center py-3 px-6 transition-colors",
              isActive(item.path) 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              {item.icon}
              {isActive(item.path) && (
                <motion.div
                  layoutId="indicator"
                  className="absolute inset-0 bg-primary/20 rounded-full -m-1.5 p-1.5"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </div>
            <span className="text-xs mt-1 font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
