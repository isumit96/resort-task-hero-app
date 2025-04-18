
import { useState } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Moon, Sun, Star, Mail, Shield, Activity, Settings as SettingsIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id as any)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
    navigate("/");
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real implementation, we would add dark mode toggle logic here
  };

  const settingsOptions = [
    { 
      icon: <Shield className="h-5 w-5 text-indigo-500" />, 
      title: "Privacy", 
      description: "Manage your data privacy settings" 
    },
    { 
      icon: <Bell className="h-5 w-5 text-amber-500" />, 
      title: "Notifications", 
      description: "Configure your notification preferences" 
    },
    { 
      icon: <Activity className="h-5 w-5 text-emerald-500" />, 
      title: "Activity", 
      description: "View your account activity log" 
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title="Settings" showBackButton showSettings={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 max-w-2xl mx-auto w-full">
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {user && (
            <Card className="overflow-hidden border-border/40 shadow-card">
              <CardHeader className="bg-primary/5 border-b border-border/40 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{profile?.username || 'User'}</CardTitle>
                    <CardDescription className="text-sm">
                      {profile?.role || 'Resort Staff'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-3 p-2">
                  <Mail className="text-muted-foreground h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2">
                  <Star className="text-muted-foreground h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium">Account Type</div>
                    <div className="text-sm text-muted-foreground">{profile?.role === 'manager' ? 'Manager' : 'Employee'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="border-border/40 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-muted-foreground">Toggle dark theme</div>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={toggleDarkMode}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settingsOptions.map((option, index) => (
                <button
                  key={index}
                  className="flex items-center justify-between w-full p-2 text-left rounded-md hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <div>
                      <div className="font-medium">{option.title}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
          
          <Button 
            variant="destructive" 
            className="w-full shadow-lg hover:shadow-destructive/25 transition-all"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            Log Out
          </Button>
        </motion.div>
      </div>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default Settings;

function Bell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
