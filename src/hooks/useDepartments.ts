
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Hook to fetch departments list from the DB
export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data?.map(dep => dep.name) || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
