import { sendDebugLog } from './android-bridge';

/**
 * Utility functions for handling file uploads and storage interactions.
 */

/**
 * Simulate upload to storage (mock function)
 * @param file The file to upload
 * @param path The path to upload the file to
 * @returns Promise that resolves with the URL of the uploaded file
 */
export const uploadFileToStorage = async (file: File, path: string): Promise<string> => {
  return new Promise((resolve) => {
    console.log(`Simulating upload of ${file.name} to ${path}`);
    sendDebugLog('Storage', `Simulating upload of ${file.name} to ${path}`);
    
    // Simulate a delay to mimic network latency
    setTimeout(() => {
      const url = `https://example.com/${path}/${file.name}`;
      console.log(`Simulated upload complete. URL: ${url}`);
      sendDebugLog('Storage', `Simulated upload complete. URL: ${url}`);
      resolve(url);
    }, 1000);
  });
};

/**
 * Get an image from the camera using a file input
 * @returns Promise that resolves with the File object or null if no file was selected
 */
export const getImageFromCamera = (): Promise<File | null> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Triggering camera file selection dialog');
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
          console.log(`Selected file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
          sendDebugLog('Camera', `File selected: ${file.name} (${Math.round(file.size/1024)}KB)`);
          resolve(file);
        } else {
          console.log('No file selected');
          sendDebugLog('Camera', 'No file selected');
          resolve(null);
        }
      };
      
      // Handle cancellation
      input.oncancel = () => {
        console.log('File selection cancelled');
        sendDebugLog('Camera', 'File selection cancelled');
        resolve(null);
      };
      
      // Handle if the dialog is closed without selection
      setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          console.log('File input timeout - assuming cancelled');
          sendDebugLog('Camera', 'File selection assumed cancelled (timeout)');
        }
      }, 300000); // 5 minute timeout
      
      // Trigger the file selection dialog
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      console.error('Error getting image from camera:', error);
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
          console.log(`Selected video: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
          sendDebugLog('Camera', `Video selected: ${file.name} (${Math.round(file.size/1024)}KB)`);
          resolve(file);
        } else {
          console.log('No video selected');
          sendDebugLog('Camera', 'No video selected');
          resolve(null);
        }
      };
      
      // Handle cancellation
      input.oncancel = () => {
        console.log('Video selection cancelled');
        sendDebugLog('Camera', 'Video selection cancelled');
        resolve(null);
      };
      
      // Trigger the file selection dialog
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
    } catch (error) {
      console.error('Error getting video from camera:', error);
      sendDebugLog('CameraError', `Video input error: ${error instanceof Error ? error.message : String(error)}`);
      reject(error);
    }
  });
};
