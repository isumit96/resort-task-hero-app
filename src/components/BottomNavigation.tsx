
import { Home, ClipboardCheck, Calendar } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const BottomNavigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
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
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-md">
      <div className="flex justify-around">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center py-3 px-6 ${
              isActive(item.path)
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div>{item.icon}</div>
            <span className="text-xs mt-1">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavigation;
