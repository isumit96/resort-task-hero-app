
import { supabase } from "@/integrations/supabase/client";
import { isAndroidWebView, sendDebugLog, checkConnectivity } from "@/utils/android-bridge";

// Improved file upload function with optimizations for mobile WebView
export const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
  // Return empty string for empty files (used when clearing/removing images)
  if (file.size === 0 && file.name === "removed") {
    return "";
  }

  // Check connectivity first
  if (!checkConnectivity()) {
    throw new Error('No internet connection. Please check your connectivity and try again.');
  }

  // Validate the file
  if (!file) {
    throw new Error('No file provided for upload');
  }

  // Validate file type
  if (folder === 'photos' && !file.type.startsWith('image/')) {
    throw new Error(`Invalid file type: ${file.type}. Expected an image.`);
  } else if (folder === 'videos' && !file.type.startsWith('video/')) {
    throw new Error(`Invalid file type: ${file.type}. Expected a video.`);
  }

  // Size check to prevent large file uploads - 10MB max
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds limit (${Math.round(file.size/1024/1024)}MB). Maximum allowed: 10MB`);
  }

  // Handle empty files more gracefully
  if (file.size === 0) {
    throw new Error('File appears to be empty. Please try again.');
  }

  // Compress image if it's a photo before uploading
  let fileToUpload = file;
  
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await compressImageIfNeeded(file);
    } catch (error) {
      console.error('Image compression failed, using original:', error);
      sendDebugLog('Upload', `Compression failed: ${error}. Using original file.`);
      // Continue with original if compression fails
    }
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const filePath = `${folder}/${fileName}`;

  // Console.log for debugging WebView uploads
  console.log(`Uploading file: ${fileName} (${fileToUpload.type}, ${Math.round(fileToUpload.size/1024)}KB)`);
  sendDebugLog('Upload', `Uploading ${folder} file: ${Math.round(fileToUpload.size/1024)}KB`);

  try {
    const { data, error } = await supabase.storage
      .from('task-attachments')
      .upload(filePath, fileToUpload);

    if (error) {
      console.error('Storage upload error:', error);
      sendDebugLog('UploadError', `Supabase error: ${error.message}`);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(data.path);

    console.log('Upload successful, public URL:', publicUrl);
    sendDebugLog('Upload', 'File uploaded successfully');
    return publicUrl;
  } catch (error) {
    console.error('Upload failed with error:', error);
    sendDebugLog('UploadError', `Failed: ${error.message || 'Unknown error'}`);
    throw error;
  }
};

// Helper function to compress images for faster uploads on mobile
async function compressImageIfNeeded(file: File): Promise<File> {
  // Skip compression for small files (less than 500KB)
  if (file.size < 500 * 1024) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // Resize large images
      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 1280;
      
      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Use lower quality for JPEG - adjust quality based on file size
      let quality = 0.75; // Default quality
      if (file.size > 2 * 1024 * 1024) {
        quality = 0.6; // More compression for larger files
      }
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }
        
        const newFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        URL.revokeObjectURL(img.src); // Clean up
        resolve(newFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      reject(new Error('Failed to load image'));
    };
  });
}

// Define global handler for Android native app callbacks
// This will be called from the Android WebView when there are camera or file errors
declare global {
  interface Window {
    handleAndroidFileError?: (errorType: string, message: string) => void;
    receiveFileFromAndroid?: (base64Data: string, fileName: string, mimeType: string) => Promise<File>;
    androidCameraCapture?: {
      capturePhoto: () => void;
      captureVideo: () => void;
    };
    receiveImageFromAndroid?: (requestId: string, base64Data: string, fileName: string, mimeType: string) => void;
    receiveAndroidCameraError?: (requestId: string, errorCode: string, errorMessage: string) => void;
    androidBridge?: {
      captureRequests: Map<number, (file: File | null) => void>;
      nextRequestId: number;
    };
  }
}

// Set up global handlers for Android WebView communication
if (typeof window !== 'undefined') {
  // Error handler for Android WebView callbacks
  if (!window.handleAndroidFileError) {
    window.handleAndroidFileError = (errorType: string, message: string) => {
      console.error(`Android file error [${errorType}]:`, message);
      sendDebugLog('AndroidError', `${errorType}: ${message}`);
      
      // Dispatch custom event that components can listen for
      const errorEvent = new CustomEvent('android-file-error', {
        detail: { errorType, message }
      });
      document.dispatchEvent(errorEvent);
    };
  }
  
  // Handler to receive file data directly from Android
  if (!window.receiveFileFromAndroid) {
    window.receiveFileFromAndroid = async (base64Data: string, fileName: string, mimeType: string): Promise<File> => {
      try {
        // Convert base64 to blob
        const response = await fetch(`data:${mimeType};base64,${base64Data}`);
        const blob = await response.blob();
        
        // Create File object from blob
        return new File([blob], fileName, { type: mimeType });
      } catch (error) {
        console.error('Error converting base64 to File:', error);
        throw error;
      }
    };
  }
  
  // Handler for receiving camera files from Android native code
  if (!window.receiveImageFromAndroid) {
    window.receiveImageFromAndroid = (requestId: string, base64Data: string, fileName: string, mimeType: string) => {
      sendDebugLog('Camera', `Received image from Android: request #${requestId}, file size ${Math.round(base64Data.length * 0.75 / 1024)}KB`);
      
      try {
        // Create file from base64 data
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          
          const byteNumbers = new Array(slice.length);
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: mimeType });
        const file = new File([blob], fileName || 'camera-photo.jpg', { type: mimeType });
        
        // Validate file
        if (!file || file.size === 0) {
          sendDebugLog('CameraError', 'Received empty file from Android');
          throw new Error('Received empty file from Android');
        }
        
        // Get the callback for this specific request
        const callback = window.androidBridge?.captureRequests.get(parseInt(requestId));
        
        if (callback) {
          // Clear the capture request
          window.androidBridge?.captureRequests.delete(parseInt(requestId));
          sendDebugLog('Camera', 'Successfully processed image, calling callback');
          callback(file);
        } else {
          console.error(`No callback found for camera request #${requestId}`);
          sendDebugLog('CameraError', `No callback found for request #${requestId}`);
        }
      } catch (error) {
        console.error('Error processing image from Android:', error);
        sendDebugLog('CameraError', `Processing error: ${error}`);
        
        // Try to resolve the request as failed
        const callback = window.androidBridge?.captureRequests.get(parseInt(requestId));
        if (callback) {
          window.androidBridge?.captureRequests.delete(parseInt(requestId));
          callback(null);
        }
      }
    };
  }
  
  // Handler for receiving camera errors from Android native code
  if (!window.receiveAndroidCameraError) {
    window.receiveAndroidCameraError = (requestId: string, errorCode: string, errorMessage: string) => {
      console.error(`Android camera error for request #${requestId}: [${errorCode}] ${errorMessage}`);
      sendDebugLog('CameraError', `Android error for #${requestId}: [${errorCode}] ${errorMessage}`);
      
      // Get the callback for this specific request
      const callback = window.androidBridge?.captureRequests.get(parseInt(requestId));
      
      if (callback) {
        // Clear the request
        window.androidBridge?.captureRequests.delete(parseInt(requestId));
        callback(null);
      }
    };
  }
}

// Android WebView-optimized camera capture function
export const getImageFromCamera = async (): Promise<File | null> => {
  console.log('Starting camera capture process');
  sendDebugLog('Camera', 'Starting camera capture process');
  
  // Check if we have direct Android bridge access
  if (window.androidCameraCapture && typeof window.androidCameraCapture.capturePhoto === 'function') {
    console.log('Using Android native camera bridge');
    sendDebugLog('Camera', 'Using Android native camera bridge');
    
    return new Promise((resolve) => {
      // Listen for file from Android
      const handleFileReceived = (e: CustomEvent) => {
        document.removeEventListener('android-file-received', handleFileReceived as EventListener);
        resolve(e.detail.file);
      };
      
      // Listen for errors from Android
      const handleFileError = (e: CustomEvent) => {
        document.removeEventListener('android-file-error', handleFileError as EventListener);
        console.error('Android camera error:', e.detail);
        sendDebugLog('CameraError', `Event error: ${JSON.stringify(e.detail)}`);
        resolve(null);
      };
      
      // Set up event listeners
      document.addEventListener('android-file-received', handleFileReceived as EventListener);
      document.addEventListener('android-file-error', handleFileError as EventListener);
      
      // Call Android bridge method
      window.androidCameraCapture.capturePhoto();
      
      // Safety timeout in case Android doesn't call back
      setTimeout(() => {
        document.removeEventListener('android-file-received', handleFileReceived as EventListener);
        document.removeEventListener('android-file-error', handleFileError as EventListener);
        console.log('Android camera timeout reached');
        sendDebugLog('CameraError', 'Camera operation timed out after 60 seconds');
        resolve(null);
      }, 60000);
    });
  }
  
  // Fallback to standard HTML file input approach - now improved for WebView
  return new Promise((resolve) => {
    try {
      // Create file input element specifically tailored for WebView interaction
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Important: Using opacity + positioning instead of display:none for WebView compatibility
      input.style.cssText = 'position:fixed;top:0;left:0;opacity:0.01;width:100%;height:100%;z-index:99999;';
      
      // For Android WebView, using "environment" for back camera works more reliably
      const isInAndroidWebView = isAndroidWebView();
      
      if (isInAndroidWebView) {
        // For Android WebView, explicitly set the capture attribute
        input.setAttribute('capture', 'environment');
        sendDebugLog('Camera', 'Android WebView detected, using capture=environment attribute');
      } else if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // For other mobile browsers, still use capture but may behave differently
        input.setAttribute('capture', 'environment');
        sendDebugLog('Camera', 'Mobile browser detected, using capture=environment attribute');
      }
      
      let fileSelected = false;
      let checkCount = 0;
      const maxChecks = 5;
      
      // Enhanced change handler with additional validation
      const handleChange = () => {
        console.log('Camera file input change event fired');
        fileSelected = true;
        
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          
          // Android WebView sometimes returns empty files
          if (file.size === 0) {
            console.error('Camera returned an empty file');
            sendDebugLog('CameraError', 'Camera returned an empty file');
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve(null);
            return;
          }
          
          // Also verify file type
          if (!file.type.startsWith('image/')) {
            console.error(`Invalid file type: ${file.type}`);
            sendDebugLog('CameraError', `Invalid file type: ${file.type}`);
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve(null);
            return;
          }
          
          console.log(`Camera capture success: ${file.name} (${file.type}, ${Math.round(file.size/1024)}KB)`);
          sendDebugLog('Camera', `Capture success: ${file.name} (${Math.round(file.size/1024)}KB)`);
          
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(file);
        } else {
          console.log('Camera capture: no file selected in change event');
          sendDebugLog('Camera', 'No file selected in change event');
          
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(null);
        }
      };
      
      // Additional event handlers for better WebView compatibility
      const handleClick = () => {
        console.log('Camera file input clicked');
        sendDebugLog('Camera', 'File input clicked');
      };
      
      const handleFocus = () => {
        console.log('Camera file input received focus');
        sendDebugLog('Camera', 'File input focused');
      };
      
      // Critical for WebView: check for files after blur
      const handleBlur = () => {
        console.log('Camera file input lost focus, checking for files');
        sendDebugLog('Camera', 'File input lost focus');
        
        // Add secondary delayed check for Android WebView edge cases
        setTimeout(() => {
          if (!fileSelected && input.files && input.files.length > 0) {
            const file = input.files[0];
            console.log(`Camera capture detected on blur: ${file.name}`);
            sendDebugLog('Camera', `File detected on blur: ${file.name}`);
            fileSelected = true;
            
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve(file);
          }
        }, 500);
      };
      
      // Android WebView specific check - periodically poll for files
      // This helps with WebViews that don't properly trigger change events
      const checkForFilesPolling = () => {
        if (fileSelected || checkCount >= maxChecks) return;
        
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          console.log(`Camera file detected through polling (${checkCount}): ${file.name}`);
          sendDebugLog('Camera', `File detected through polling: ${file.name}`);
          fileSelected = true;
          
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(file);
          return;
        }
        
        checkCount++;
        setTimeout(checkForFilesPolling, 1000); // Check every second
      };
      
      // Connect all event handlers
      input.addEventListener('change', handleChange);
      input.addEventListener('click', handleClick);
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      
      // Add global error listener for Android errors
      const handleAndroidError = (e: CustomEvent) => {
        console.log('Received Android error event:', e.detail);
        sendDebugLog('CameraError', `Android error: ${JSON.stringify(e.detail)}`);
        document.removeEventListener('android-file-error', handleAndroidError as EventListener);
        if (!fileSelected) {
          fileSelected = true;
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(null);
        }
      };
      document.addEventListener('android-file-error', handleAndroidError as EventListener);
      
      // Trigger camera with click after a small delay for WebView readiness
      setTimeout(() => {
        console.log('Triggering camera file selection dialog');
        sendDebugLog('Camera', 'Opening file selection dialog');
        document.body.appendChild(input); // Append to DOM - IMPORTANT for WebView
        input.click();
        
        // Start polling check for Android WebView (helps with some devices)
        if (isInAndroidWebView) {
          setTimeout(checkForFilesPolling, 2000);
        }
        
        // Safety timeout to prevent hanging promises in WebView
        setTimeout(() => {
          if (!fileSelected) {
            console.log('Camera capture timeout reached, resolving as null');
            sendDebugLog('CameraError', 'Operation timeout (60s)');
            
            // Clean up event listeners to prevent memory leaks
            input.removeEventListener('change', handleChange);
            input.removeEventListener('click', handleClick);
            input.removeEventListener('focus', handleFocus);
            input.removeEventListener('blur', handleBlur);
            document.removeEventListener('android-file-error', handleAndroidError as EventListener);
            
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            
            resolve(null);
          }
        }, 60000); // 1 minute timeout for worst-case WebView behavior
      }, 100);
      
    } catch (error) {
      console.error('Error setting up camera capture:', error);
      sendDebugLog('CameraError', `Setup error: ${error}`);
      resolve(null);
    }
  });
};

// Add function for Android video capture (similar to getImageFromCamera)
export const getVideoFromCamera = async (): Promise<File | null> => {
  console.log('Starting video capture process');
  sendDebugLog('Video', 'Starting video capture process');
  
  // Check if we have direct Android bridge access
  if (window.androidCameraCapture && typeof window.androidCameraCapture.captureVideo === 'function') {
    console.log('Using Android native video bridge');
    sendDebugLog('Video', 'Using Android native video bridge');
    
    return new Promise((resolve) => {
      // Listen for file from Android
      const handleFileReceived = (e: CustomEvent) => {
        document.removeEventListener('android-file-received', handleFileReceived as EventListener);
        resolve(e.detail.file);
      };
      
      // Listen for errors from Android
      const handleFileError = (e: CustomEvent) => {
        document.removeEventListener('android-file-error', handleFileError as EventListener);
        console.error('Android video error:', e.detail);
        sendDebugLog('VideoError', `Event error: ${JSON.stringify(e.detail)}`);
        resolve(null);
      };
      
      // Set up event listeners
      document.addEventListener('android-file-received', handleFileReceived as EventListener);
      document.addEventListener('android-file-error', handleFileError as EventListener);
      
      // Call Android bridge method
      window.androidCameraCapture.captureVideo();
      
      // Safety timeout in case Android doesn't call back
      setTimeout(() => {
        document.removeEventListener('android-file-received', handleFileReceived as EventListener);
        document.removeEventListener('android-file-error', handleFileError as EventListener);
        console.log('Android video timeout reached');
        sendDebugLog('VideoError', 'Video operation timed out after 5 minutes');
        resolve(null);
      }, 300000); // 5 minutes for video recording
    });
  }
  
  // Fallback to standard HTML file input approach for video
  return new Promise((resolve) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'video/*';
      
      // Important: Using opacity + positioning instead of display:none for WebView compatibility
      input.style.cssText = 'position:fixed;top:0;left:0;opacity:0.01;width:100%;height:100%;z-index:99999;';
      
      const isInAndroidWebView = isAndroidWebView();
      
      if (isInAndroidWebView) {
        input.setAttribute('capture', 'environment');
        sendDebugLog('Video', 'Android WebView detected, using capture=environment attribute for video');
      }
      
      let fileSelected = false;
      
      const handleChange = () => {
        console.log('Video input change event fired');
        sendDebugLog('Video', 'Change event fired');
        fileSelected = true;
        
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          
          if (file.size === 0) {
            console.error('Video recording returned an empty file');
            sendDebugLog('VideoError', 'Empty file received');
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve(null);
            return;
          }
          
          // Verify file type
          if (!file.type.startsWith('video/')) {
            console.error(`Invalid file type: ${file.type}`);
            sendDebugLog('VideoError', `Invalid file type: ${file.type}`);
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve(null);
            return;
          }
          
          console.log(`Video capture success: ${file.name} (${file.type}, ${Math.round(file.size/1024)}KB)`);
          sendDebugLog('Video', `Capture success: ${file.name} (${Math.round(file.size/1024)}KB)`);
          
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(file);
        } else {
          console.log('Video capture: no file selected');
          sendDebugLog('Video', 'No file selected');
          
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(null);
        }
      };
      
      // Handle blur event for WebView compatibility
      const handleBlur = () => {
        setTimeout(() => {
          if (!fileSelected && input.files && input.files.length > 0) {
            const file = input.files[0];
            fileSelected = true;
            sendDebugLog('Video', `File detected on blur: ${file.name}`);
            
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            resolve(file);
          }
        }, 500);
      };
      
      input.addEventListener('change', handleChange);
      input.addEventListener('blur', handleBlur);
      
      // Add global error listener for Android errors
      const handleAndroidError = (e: CustomEvent) => {
        document.removeEventListener('android-file-error', handleAndroidError as EventListener);
        sendDebugLog('VideoError', `Android error: ${JSON.stringify(e.detail)}`);
        if (!fileSelected) {
          fileSelected = true;
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
          resolve(null);
        }
      };
      document.addEventListener('android-file-error', handleAndroidError as EventListener);
      
      setTimeout(() => {
        console.log('Triggering video selection dialog');
        sendDebugLog('Video', 'Opening video selection dialog');
        document.body.appendChild(input);
        input.click();
        
        setTimeout(() => {
          if (!fileSelected) {
            console.log('Video capture timeout reached');
            sendDebugLog('VideoError', 'Operation timeout (5m)');
            
            input.removeEventListener('change', handleChange);
            input.removeEventListener('blur', handleBlur);
            document.removeEventListener('android-file-error', handleAndroidError as EventListener);
            
            if (document.body.contains(input)) {
              document.body.removeChild(input);
            }
            
            resolve(null);
          }
        }, 300000); // 5 minute timeout for video recording
      }, 100);
      
    } catch (error) {
      console.error('Error setting up video capture:', error);
      sendDebugLog('VideoError', `Setup error: ${error}`);
      resolve(null);
    }
  });
};
