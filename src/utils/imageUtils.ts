import { type CanvasDimensions } from '@/lib/types';

const TOOLBAR_HEIGHT = 80;

export const calculateCanvasDimensions = (img: HTMLImageElement): CanvasDimensions => {
  // Use full window size minus 1rem (16px) padding on each side
  const padding = 16; // 1rem = 16px
  const availableWidth = window.innerWidth - (padding * 2);
  const availableHeight = window.innerHeight - TOOLBAR_HEIGHT - (padding * 2);
  
  const imageAspectRatio = img.width / img.height;
  const availableAspectRatio = availableWidth / availableHeight;
  
  let width: number;
  let height: number;
  
  if (imageAspectRatio > availableAspectRatio) {
    // Image is wider than available space - fit to width
    width = availableWidth;
    height = width / imageAspectRatio;
  } else {
    // Image is taller than available space - fit to height  
    height = availableHeight;
    width = height * imageAspectRatio;
  }
  
  return { width, height };
};

export const validateImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

/**
 * Image compression configuration
 */
const COMPRESSION_CONFIG = {
  MAX_FILE_SIZE_MB: 10, // 10MB threshold
  MAX_DIMENSION: 4096, // Max width or height
  QUALITY: 0.85, // JPEG quality (0.0 to 1.0)
  CANVAS_MEMORY_LIMIT: 8192 * 8192, // ~256MB at 4 bytes per pixel
};

/**
 * Compresses an image if it exceeds size or dimension limits
 * Reduces memory usage and improves performance
 */
export const compressImageIfNeeded = (
  img: HTMLImageElement,
  originalFile: File
): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const fileSizeMB = originalFile.size / (1024 * 1024);
    const needsCompression = 
      fileSizeMB > COMPRESSION_CONFIG.MAX_FILE_SIZE_MB ||
      img.width > COMPRESSION_CONFIG.MAX_DIMENSION ||
      img.height > COMPRESSION_CONFIG.MAX_DIMENSION ||
      (img.width * img.height) > COMPRESSION_CONFIG.CANVAS_MEMORY_LIMIT;

    if (!needsCompression) {
      resolve(img);
      return;
    }

    console.info(
      `Compressing large image: ${img.width}x${img.height} (${fileSizeMB.toFixed(1)}MB)`
    );

    // Calculate new dimensions while preserving aspect ratio
    let newWidth = img.width;
    let newHeight = img.height;
    
    const aspectRatio = img.width / img.height;
    
    // Scale down if dimensions exceed limits
    if (img.width > COMPRESSION_CONFIG.MAX_DIMENSION || 
        img.height > COMPRESSION_CONFIG.MAX_DIMENSION) {
      if (img.width > img.height) {
        newWidth = COMPRESSION_CONFIG.MAX_DIMENSION;
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = COMPRESSION_CONFIG.MAX_DIMENSION;
        newWidth = newHeight * aspectRatio;
      }
    }
    
    // Further scale down if total pixels exceed memory limit
    const totalPixels = newWidth * newHeight;
    if (totalPixels > COMPRESSION_CONFIG.CANVAS_MEMORY_LIMIT) {
      const scale = Math.sqrt(COMPRESSION_CONFIG.CANVAS_MEMORY_LIMIT / totalPixels);
      newWidth *= scale;
      newHeight *= scale;
    }
    
    // Round to integers
    newWidth = Math.floor(newWidth);
    newHeight = Math.floor(newHeight);
    
    // Create canvas for compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {
      alpha: false, // No transparency needed
      desynchronized: true, // Allow async rendering
    });
    
    if (!ctx) {
      console.warn('Failed to create compression canvas, using original image');
      resolve(img);
      return;
    }
    
    try {
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw compressed image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob and create new image
      canvas.toBlob((blob) => {
        if (!blob) {
          console.warn('Failed to compress image, using original');
          resolve(img);
          return;
        }
        
        const compressedImg = new Image();
        compressedImg.onload = () => {
          // Clean up canvas to free memory
          canvas.width = 1;
          canvas.height = 1;
          
          URL.revokeObjectURL(compressedImg.src);
          
          const compressionRatio = ((originalFile.size - blob.size) / originalFile.size * 100);
          console.info(
            `Image compressed: ${img.width}x${img.height} → ${newWidth}x${newHeight} ` +
            `(${compressionRatio.toFixed(1)}% size reduction)`
          );
          
          resolve(compressedImg);
        };
        
        compressedImg.onerror = () => {
          console.warn('Failed to load compressed image, using original');
          // Clean up canvas
          canvas.width = 1;
          canvas.height = 1;
          resolve(img);
        };
        
        compressedImg.src = URL.createObjectURL(blob);
      }, 'image/jpeg', COMPRESSION_CONFIG.QUALITY);
      
    } catch (error) {
      console.warn('Error during image compression:', error);
      // Clean up canvas
      canvas.width = 1;
      canvas.height = 1;
      resolve(img);
    }
  });
};

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!validateImageFile(file)) {
      reject(new Error('Invalid file type. Please select an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = new Image();
        
        img.onload = async () => {
          try {
            // Apply compression if needed
            const finalImg = await compressImageIfNeeded(img, file);
            resolve(finalImg);
          } catch (compressionError) {
            console.warn('Compression failed, using original image:', compressionError);
            resolve(img);
          }
        };
        
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      } catch (error) {
        reject(new Error('Failed to process image'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};