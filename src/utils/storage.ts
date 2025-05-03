
import { supabase } from "@/integrations/supabase/client";

// Improved file upload function with optimizations for mobile WebView
export const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
  // Compress image if it's a photo before uploading
  let fileToUpload = file;
  
  if (file.type.startsWith('image/')) {
    try {
      fileToUpload = await compressImageIfNeeded(file);
    } catch (error) {
      console.error('Image compression failed, using original:', error);
      // Continue with original if compression fails
    }
  }

  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const filePath = `${folder}/${fileName}`;

  // Console.log for debugging WebView uploads
  console.log(`Uploading file: ${fileName} (${fileToUpload.type}, ${Math.round(fileToUpload.size/1024)}KB)`);

  const { data, error } = await supabase.storage
    .from('task-attachments')
    .upload(filePath, fileToUpload);

  if (error) {
    console.error('Storage upload error:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('task-attachments')
    .getPublicUrl(data.path);

  console.log('Upload successful, public URL:', publicUrl);
  return publicUrl;
};

// Helper function to compress images for faster uploads on mobile
async function compressImageIfNeeded(file: File): Promise<File> {
  // Skip compression for small files (less than 1MB)
  if (file.size < 1024 * 1024) {
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
      
      // Use lower quality for JPEG
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
      }, 'image/jpeg', 0.75); // Use JPEG with 75% quality
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src); // Clean up
      reject(new Error('Failed to load image'));
    };
  });
}

// Enhanced WebView camera capture function with better callbacks and file handling
export const getImageFromCamera = async (): Promise<File | null> => {
  console.log('Starting camera capture process');
  
  return new Promise((resolve) => {
    try {
      // Create file input element specifically for WebView interaction
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // For mobile, prioritize camera but allow gallery fallback
      // Using 'camera' instead of 'environment' for better WebView compatibility
      input.capture = 'camera';
      
      console.log('Camera file input created with capture=camera');
      
      // Time tracking for debugging
      const startTime = Date.now();
      let fileSelected = false;
      
      // Primary change handler - this is our main successful path
      const handleChange = () => {
        console.log('Camera file input change event fired');
        fileSelected = true;
        
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          console.log(`Camera capture success: ${file.name} (${file.type}, ${Math.round(file.size/1024)}KB)`);
          resolve(file);
        } else {
          console.log('Camera capture: no file selected in change event');
          resolve(null);
        }
      };
      
      // Track click for WebView debugging
      const handleClick = () => {
        console.log('Camera file input clicked');
      };
      
      // Focus tracking for debugging WebView behavior
      const handleFocus = () => {
        console.log('Camera file input received focus');
      };
      
      // Blur tracking for detecting when WebView returns from camera
      const handleBlur = () => {
        console.log('Camera file input lost focus, checking for files');
        
        // Secondary check for files - some WebViews might not trigger change event
        setTimeout(() => {
          if (!fileSelected && input.files && input.files.length > 0) {
            const file = input.files[0];
            console.log(`Camera capture detected on blur: ${file.name}`);
            fileSelected = true;
            resolve(file);
          }
        }, 500);
      };
      
      // Critical: WebView handling for when user cancels or something fails
      input.addEventListener('change', handleChange);
      input.addEventListener('click', handleClick);
      input.addEventListener('focus', handleFocus);
      input.addEventListener('blur', handleBlur);
      
      // Trigger camera with click after a small delay for WebView readiness
      setTimeout(() => {
        console.log('Triggering camera file selection dialog');
        input.click();
        
        // Safety timeout to prevent hanging promises in WebView
        setTimeout(() => {
          if (!fileSelected) {
            console.log('Camera capture timeout reached, resolving as null');
            // Clean up event listeners to prevent memory leaks
            input.removeEventListener('change', handleChange);
            input.removeEventListener('click', handleClick);
            input.removeEventListener('focus', handleFocus);
            input.removeEventListener('blur', handleBlur);
            resolve(null);
          }
        }, 60000); // 1 minute timeout for worst-case WebView behavior
      }, 100);
      
    } catch (error) {
      console.error('Error setting up camera capture:', error);
      resolve(null);
    }
  });
};
