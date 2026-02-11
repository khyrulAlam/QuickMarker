/**
 * Image Data Utilities
 * 
 * Pure utility functions for handling image data conversion between different formats.
 * These functions handle the conversion between HTMLImageElement and Base64 strings
 * for persistence in IndexedDB.
 * 
 * Key responsibilities:
 * - Convert HTMLImageElement to Base64 string for storage
 * - Convert Base64 string back to HTMLImageElement for display
 * - Handle image quality and compression settings
 * - Validate image data and handle conversion errors
 * - Provide consistent image format handling across the application
 */

/**
 * Default image quality for Base64 conversion
 * 0.95 provides a good balance between file size and quality
 */
const DEFAULT_IMAGE_QUALITY = 0.95;

/**
 * Maximum image dimensions to prevent memory issues
 * Large images will be scaled down to fit within these bounds
 */
const MAX_IMAGE_WIDTH = 4096;
const MAX_IMAGE_HEIGHT = 4096;

/**
 * Converts an HTMLImageElement to a Base64 string
 * This allows images to be stored in IndexedDB
 * 
 * @param image - The image element to convert
 * @param quality - JPEG quality (0-1), defaults to 0.95
 * @param format - Image format ('image/jpeg' | 'image/png'), defaults to 'image/jpeg'
 * @returns Base64 encoded image string
 * @throws Error if conversion fails
 */
export const imageToBase64 = (
  image: HTMLImageElement,
  quality: number = DEFAULT_IMAGE_QUALITY,
  format: string = 'image/jpeg'
): string => {
  try {
    // Create canvas element for conversion
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Calculate scaled dimensions if image is too large
    const { width, height } = calculateScaledDimensions(image.width, image.height);
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw image to canvas with scaling if needed
    ctx.drawImage(image, 0, 0, width, height);
    
    // Convert canvas to Base64
    const base64 = canvas.toDataURL(format, quality);
    
    // Validate the result
    if (!base64 || base64 === 'data:,') {
      throw new Error('Canvas conversion produced empty result');
    }
    
    return base64;
    
  } catch (error) {
    console.error('Image to Base64 conversion failed:', error);
    throw new Error('Failed to convert image to Base64');
  }
};

/**
 * Converts a Base64 string back to an HTMLImageElement
 * This restores images from IndexedDB storage
 * 
 * @param base64 - Base64 encoded image string
 * @returns Promise that resolves to loaded image element
 * @throws Error if conversion fails
 */
export const base64ToImage = (base64: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    try {
      // Validate input
      if (!base64 || typeof base64 !== 'string') {
        reject(new Error('Invalid Base64 input'));
        return;
      }
      
      // Validate Base64 format
      if (!isValidBase64ImageString(base64)) {
        reject(new Error('Invalid Base64 image format'));
        return;
      }
      
      // Create image element
      const image = new Image();
      
      // Set up event handlers
      image.onload = () => {
        // Validate loaded image
        if (image.width === 0 || image.height === 0) {
          reject(new Error('Loaded image has invalid dimensions'));
          return;
        }
        
        resolve(image);
      };
      
      image.onerror = (error) => {
        console.error('Image loading failed:', error);
        reject(new Error('Failed to load image from Base64 data'));
      };
      
      // Set source to trigger loading
      image.src = base64;
      
    } catch (error) {
      console.error('Base64 to image conversion failed:', error);
      reject(new Error('Failed to convert Base64 to image'));
    }
  });
};

/**
 * Estimates the file size of a Base64 encoded image
 * Useful for storage quota management and user feedback
 * 
 * @param base64 - Base64 encoded image string
 * @returns Estimated size in bytes
 */
export const estimateBase64Size = (base64: string): number => {
  try {
    // Remove data URL prefix if present
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Calculate size: every 4 Base64 characters represent 3 bytes
    // Plus padding adjustment
    const padding = (base64Data.match(/=/g) || []).length;
    return Math.floor((base64Data.length * 3) / 4) - padding;
    
  } catch (error) {
    console.error('Failed to estimate Base64 size:', error);
    return 0;
  }
};

/**
 * Compresses an image by reducing quality or dimensions
 * Useful for reducing storage space when needed
 * 
 * @param image - Image to compress
 * @param targetSizeKB - Target size in kilobytes
 * @param maxAttempts - Maximum compression attempts
 * @returns Compressed Base64 image string
 */
export const compressImage = (
  image: HTMLImageElement,
  targetSizeKB: number,
  maxAttempts: number = 5
): string => {
  let quality = 0.9;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    const base64 = imageToBase64(image, quality);
    const sizeKB = estimateBase64Size(base64) / 1024;
    
    if (sizeKB <= targetSizeKB || quality <= 0.1) {
      return base64;
    }
    
    // Reduce quality for next attempt
    quality -= 0.2;
    attempt++;
  }
  
  // If we couldn't reach target size, return best attempt
  return imageToBase64(image, Math.max(quality, 0.1));
};

/**
 * Validates that a string is a properly formatted Base64 image
 * 
 * @param base64 - String to validate
 * @returns True if valid Base64 image format
 */
export const isValidBase64ImageString = (base64: string): boolean => {
  try {
    // Check for data URL format
    if (!base64.startsWith('data:image/')) {
      return false;
    }
    
    // Check for Base64 marker
    if (!base64.includes(';base64,')) {
      return false;
    }
    
    // Extract Base64 data
    const base64Data = base64.split(';base64,')[1];
    
    // Check Base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(base64Data);
    
  } catch (error) {
    return false;
  }
};

/**
 * Gets image format from Base64 data URL
 * 
 * @param base64 - Base64 image string
 * @returns Image format (e.g., 'image/jpeg', 'image/png') or null if invalid
 */
export const getImageFormatFromBase64 = (base64: string): string | null => {
  try {
    const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};

/**
 * Creates a thumbnail version of an image
 * Useful for previews or storage optimization
 * 
 * @param image - Source image
 * @param maxWidth - Maximum thumbnail width
 * @param maxHeight - Maximum thumbnail height
 * @param quality - JPEG quality for thumbnail
 * @returns Base64 encoded thumbnail
 */
export const createThumbnail = (
  image: HTMLImageElement,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8
): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Calculate thumbnail dimensions maintaining aspect ratio
    const { width, height } = calculateScaledDimensions(
      image.width, 
      image.height, 
      maxWidth, 
      maxHeight
    );
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw scaled image
    ctx.drawImage(image, 0, 0, width, height);
    
    return canvas.toDataURL('image/jpeg', quality);
    
  } catch (error) {
    console.error('Thumbnail creation failed:', error);
    throw new Error('Failed to create thumbnail');
  }
};

/**
 * Calculates scaled dimensions that fit within maximum bounds
 * while maintaining aspect ratio
 * 
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns Scaled dimensions
 */
const calculateScaledDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number = MAX_IMAGE_WIDTH,
  maxHeight: number = MAX_IMAGE_HEIGHT
): { width: number; height: number } => {
  let width = originalWidth;
  let height = originalHeight;
  
  // Check if scaling is needed
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  // Calculate scale factor
  const widthScale = maxWidth / width;
  const heightScale = maxHeight / height;
  const scale = Math.min(widthScale, heightScale);
  
  return {
    width: Math.floor(width * scale),
    height: Math.floor(height * scale),
  };
};

/**
 * Converts image to different format while preserving quality
 * 
 * @param image - Source image
 * @param targetFormat - Target format ('image/jpeg' | 'image/png' | 'image/webp')
 * @param quality - Quality setting (only applies to lossy formats)
 * @returns Base64 string in target format
 */
export const convertImageFormat = (
  image: HTMLImageElement,
  targetFormat: string,
  quality?: number
): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    canvas.width = image.width;
    canvas.height = image.height;
    
    // For PNG format, set white background to avoid transparency issues
    if (targetFormat === 'image/png') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.drawImage(image, 0, 0);
    
    return canvas.toDataURL(targetFormat, quality);
    
  } catch (error) {
    console.error('Image format conversion failed:', error);
    throw new Error('Failed to convert image format');
  }
};