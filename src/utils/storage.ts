
import { sendDebugLog } from './android-bridge';
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for handling file uploads and storage interactions.
 */

/**
 * Upload a file to Supabase storage
 * @param file The file to upload
 * @param path The path to upload the file to
 * @returns Promise that resolves with the URL of the uploaded file
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  // Skip upload for empty files (used for removal)
  if (file.size === 0 || file.name === "removed") {
    return "";
  }

  try {
    // Generate a unique filename to prevent collisions
    const timestamp = new Date().getTime();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${path}/${fileName}`;
    
    // Create a bucket if it doesn't exist (will be handled by RLS)
    const { error: bucketError } = await supabase
      .storage
      .createBucket('task-media', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
      });
    
    // Upload the file
    const { data, error } = await supabase
      .storage
      .from('task-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicURL } = supabase
      .storage
      .from('task-media')
      .getPublicUrl(data.path);
      
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Storage upload error:', error);
    throw error;
  }
};

/**
 * Get an image from the camera using a file input
 * @returns Promise that resolves with the File object or null if no file was selected
 */
export const getImageFromCamera = (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    try {
      // Create an input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // For Android devices, set the capture attribute to use camera directly
      if (/Android/.test(navigator.userAgent)) {
        input.setAttribute('capture', 'environment');
      }
      
      // Handle file selection
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        
        if (file) {
          resolve(file);
        } else {
          resolve(null);
        }
      };
      
      // Handle cancellation
      input.oncancel = () => {
        resolve(null);
      };
      
      // Handle if the dialog is closed without selection
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          // Timeout handling
        }
      }, 300000); // 5 minute timeout
      
      // Trigger the file selection dialog
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      reject(error);
    }
  });
};

export const getVideoFromCamera = (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    try {
      // Create an input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      // For Android devices, set the capture attribute to use camera directly
      if (/Android/.test(navigator.userAgent)) {
        input.setAttribute('capture', 'environment');
      }
      
      // Handle file selection
      input.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0] || null;
        
        if (file) {
          resolve(file);
        } else {
          resolve(null);
        }
      };
      
      // Handle cancellation
      input.oncancel = () => {
        resolve(null);
      };
      
      // Trigger the file selection dialog
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      reject(error);
    }
  });
};
