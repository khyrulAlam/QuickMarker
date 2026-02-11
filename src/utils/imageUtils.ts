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

export const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    if (!validateImageFile(file)) {
      reject(new Error('Invalid file type. Please select an image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};