
import { useState } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Bell, Shield, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/");
  };

  const toggleNotifications = () => {
    setNotifications(!notifications);
    toast({
      title: notifications ? "Notifications disabled" : "Notifications enabled",
      description: notifications ? "You will not receive notifications" : "You will now receive notifications"
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Settings" showBackButton showSettings={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {user && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <User className="text-gray-500" size={20} />
                <span>{user.email}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="text-gray-500" size={20} />
                <span>Notifications</span>
              </div>
              <Switch checked={notifications} onCheckedChange={toggleNotifications} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <HelpCircle className="text-gray-500" size={20} />
              <span>Help Center</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="text-gray-500" size={20} />
              <span>Privacy Policy</span>
            </div>
          </CardContent>
        </Card>
        
        <Button 
          variant="destructive" 
          className="w-full mt-6"
          onClick={handleLogout}
        >
          <LogOut size={18} className="mr-2" />
          Log Out
        </Button>
      </div>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default Settings;
