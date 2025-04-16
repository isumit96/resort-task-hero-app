
import { useUser } from "@/context/UserContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const { userId } = useUser();

  const { data: role } = useQuery({
    queryKey: ["userRole", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      
      if (error) throw error;
      return profile?.role;
    },
    enabled: !!userId
  });

  const isManager = role === "manager";
  return { role, isManager };
};
