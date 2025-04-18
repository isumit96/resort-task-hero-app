
import { useState } from "react";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, User, UserCircle, Mail, Phone, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Settings = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: profile } = useQuery({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Settings" showBackButton showSettings={false} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {user && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <UserCircle className="text-gray-500" size={24} />
                <div>
                  <span className="font-medium">{profile?.username || 'Not set'}</span>
                  <p className="text-sm text-gray-500">{profile?.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="text-gray-500" size={20} />
                <span>{user.email}</span>
              </div>
            </CardContent>
          </Card>
        )}
        
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
