import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { loadImageFromFile } from '@/utils/imageUtils';

export const useImageUpload = (onImageLoad: (image: HTMLImageElement) => void) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process image file (shared between upload and drag & drop)
  const processImageFile = useCallback(async (file: File) => {
    try {
      const img = await loadImageFromFile(file);
      setImage(img);
      onImageLoad(img);
      toast.success('Image loaded successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load image');
    }
  }, [onImageLoad]);

  // Handle image upload from file input
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  }, [processImageFile]);

  // Handle drag and drop events
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  }, [processImageFile]);

  const triggerUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    image,
    fileInputRef,
    handleImageUpload,
    handleDragOver,
    handleDrop,
    triggerUpload,
  };
};