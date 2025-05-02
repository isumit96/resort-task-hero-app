
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

// Extract image from WebView camera
export const getImageFromCamera = async (): Promise<File | null> => {
  return new Promise((resolve) => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Force camera on mobile
    
    // Listen for file selection
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        console.log(`Camera capture: ${file.name} (${file.type}, ${Math.round(file.size/1024)}KB)`);
        resolve(file);
      } else {
        console.log('No image captured');
        resolve(null);
      }
    };
    
    // Handle cancel
    input.oncancel = () => {
      console.log('Camera capture cancelled');
      resolve(null);
    };
    
    // Trigger file selection dialog
    input.click();
  });
};
