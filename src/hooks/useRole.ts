
import { useUser } from "@/context/UserContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const { userId } = useUser();

  const { data: role, isLoading } = useQuery({
    queryKey: ["userRole", userId],
    queryFn: async () => {
      if (!userId) {
        console.warn("No user ID found for role check");
        return null;
      }
      
      console.log("Fetching role for user:", userId);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId as string)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching role:", error);
        throw error;
      }
      
      console.log("User role data:", profile);
      return profile?.role || null;
    },
    enabled: !!userId
  });

  console.log("Current user role:", role);
  const isManager = role === "manager";
  return { role, isManager, isLoading };
};
