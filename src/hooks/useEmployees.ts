
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types";

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEmployees = async () => {
      setIsLoading(true);
      try {
        const { data: allProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, username, role");
        
        if (profilesError) {
          throw profilesError;
        }
        
        if (allProfiles && allProfiles.length > 0) {
          const formattedProfiles = allProfiles.map((profile: any) => ({
            id: profile.id,
            username: profile.username || '',
            role: profile.role || ''
          }));
          
          setEmployees(formattedProfiles);
        } else {
          toast({
            title: "No Profiles",
            description: "No profiles found in the database.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error in fetchEmployees:", error);
        toast({
          title: "Error",
          description: "Failed to fetch profiles",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployees();
  }, [toast]);

  return { employees, isLoading };
};
