
import { useUser } from "@/context/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useMemo } from "react";

export const useRole = () => {
  const { userId } = useUser();
  const queryClient = useQueryClient();

  // Try to get role from cache first
  const getCachedRole = useCallback(() => {
    if (!userId) return null;
    
    // Check if we have the role cached
    const cachedData = queryClient.getQueryData(["userRole", userId]);
    return cachedData || null;
  }, [userId, queryClient]);

  const { data: role, isLoading } = useQuery({
    queryKey: ["userRole", userId],
    queryFn: async () => {
      // Try getting role from cache first
      const cachedRole = getCachedRole();
      if (cachedRole) return cachedRole;
      
      if (!userId) {
        return null;
      }
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId as string)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching role:", error);
        throw error;
      }
      
      return profile?.role || null;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache role for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false
  });

  // Calculate derived values only once per render
  const isManager = useMemo(() => role === "manager", [role]);
  
  return { role, isManager, isLoading };
};
