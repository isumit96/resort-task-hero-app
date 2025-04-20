
import { supabase } from "@/integrations/supabase/client";

export const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .upload(`${folder}/${Date.now()}-${file.name}`, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(data.path);

  return publicUrl;
};
