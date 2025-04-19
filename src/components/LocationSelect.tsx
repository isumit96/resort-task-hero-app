
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface LocationSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const LocationSelect = ({ value, onChange }: LocationSelectProps) => {
  const { data: locations, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from("locations")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select location" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <Loader className="h-4 w-4 animate-spin mr-2" />
            <span>Loading locations...</span>
          </div>
        ) : locations && locations.length > 0 ? (
          locations.map((location) => (
            <SelectItem key={location.id} value={location.name || "unknown-location"}>
              {location.name || "Unknown Location"}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-locations" disabled>
            No locations available
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default LocationSelect;
