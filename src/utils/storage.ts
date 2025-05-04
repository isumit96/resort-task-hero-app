
import { sendDebugLog } from './android-bridge';
import { supabase } from '@/integrations/supabase/client';

/**
 * Utility functions for handling file uploads and storage interactions.
 */

/**
 * Upload file to Supabase storage
 * @param file The file to upload
 * @param path The path to upload the file to
 * @returns Promise that resolves with the URL of the uploaded file
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  // Early return for empty files or removal requests
  if (!file || file.size === 0 || file.name === "removed") {
    console.log("Storage: Empty file or removal request detected");
    sendDebugLog('Storage', `Empty file or removal request detected`);
    return "";
  }
  
  try {
    sendDebugLog('Storage', `Uploading ${file.name} (${Math.round(file.size/1024)}KB) to ${path}`);
    console.log(`Storage: Uploading ${file.name} (${Math.round(file.size/1024)}KB) to ${path}`);
    
    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${file.name.replace(/\s+/g, '_')}`;
    
    // Upload file to Supabase storage
    const { data, error } = await supabase
      .storage
      .from(path)
      .upload(uniqueFileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      sendDebugLog('StorageError', `Upload error: ${error.message}`);
      console.error(`Storage: Upload error:`, error);
      throw error;
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase
      .storage
      .from(path)
      .getPublicUrl(data.path);
    
    const url = publicUrlData.publicUrl;
    
    sendDebugLog('Storage', `Upload complete. URL: ${url}`);
    console.log(`Storage: Upload complete. URL: ${url}`);
    return url;
  } catch (error) {
    sendDebugLog('StorageError', `Upload error: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`Storage: Upload error:`, error);
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
      sendDebugLog('Camera', 'Opening file selection dialog');
      
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
          sendDebugLog('Camera', `File selected: ${file.name} (${Math.round(file.size/1024)}KB)`);
          resolve(file);
        } else {
          sendDebugLog('Camera', 'No file selected');
          resolve(null);
        }
      };
      
      // Handle cancellation
      input.oncancel = () => {
        sendDebugLog('Camera', 'File selection cancelled');
        resolve(null);
      };
      
      // Handle if the dialog is closed without selection
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          sendDebugLog('Camera', 'File selection assumed cancelled (timeout)');
        }
      }, 300000); // 5 minute timeout
      
      // Trigger the file selection dialog
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      sendDebugLog('CameraError', `File input error: ${error instanceof Error ? error.message : String(error)}`);
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
          sendDebugLog('Camera', `Video selected: ${file.name} (${Math.round(file.size/1024)}KB)`);
          resolve(file);
        } else {
          sendDebugLog('Camera', 'No video selected');
          resolve(null);
        }
      };
      
      // Handle cancellation
      input.oncancel = () => {
        sendDebugLog('Camera', 'Video selection cancelled');
        resolve(null);
      };
      
      // Trigger the file selection dialog
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      sendDebugLog('CameraError', `Video input error: ${error instanceof Error ? error.message : String(error)}`);
      reject(error);
    }
  });
};
