
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, Moon, Sun, Mail, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Settings = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                      (!('darkMode' in localStorage) && 
                       window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setDarkMode(isDarkMode);
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
      title: t('common.loggedOut'),
      description: t('auth.logoutSuccess')
    });
    navigate("/");
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    toast({
      title: newDarkMode ? t('settings.darkModeEnabled') : t('settings.lightModeEnabled'),
      description: newDarkMode 
        ? t('settings.darkModeEnabledDesc') 
        : t('settings.lightModeEnabledDesc')
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header title={t('navigation.settings')} showBackButton showSettings={false} />
      
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
                    <CardTitle className="text-xl">{profile?.username || t('common.user')}</CardTitle>
                    <CardDescription className="text-sm">
                      {profile?.role === 'manager' ? t('settings.manager') : t('settings.employee')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex items-center gap-3 p-2">
                  <Mail className="text-muted-foreground h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium">{t('settings.email')}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2">
                  <Shield className="text-muted-foreground h-5 w-5" />
                  <div>
                    <div className="text-sm font-medium">{t('settings.accountType')}</div>
                    <div className="text-sm text-muted-foreground">{profile?.role === 'manager' ? t('settings.manager') : t('settings.employee')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="border-border/40 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {darkMode ? (
                  <Moon className="h-5 w-5 text-primary" />
                ) : (
                  <Sun className="h-5 w-5 text-amber-500" />
                )}
                {t('settings.appearance')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">{t('settings.darkMode')}</div>
                    <div className="text-sm text-muted-foreground">{t('settings.darkModeDescription')}</div>
                  </div>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={toggleDarkMode}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">{t('settings.language')}</div>
                      <div className="text-sm text-muted-foreground">{t('settings.languageDescription')}</div>
                    </div>
                    <LanguageSwitcher />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button 
            variant="destructive" 
            className="w-full shadow-lg hover:shadow-destructive/25 transition-all"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            {t('settings.logout')}
          </Button>
        </motion.div>
      </div>
      
      <div className="h-16" />
      <BottomNavigation />
    </div>
  );
};

export default Settings;
