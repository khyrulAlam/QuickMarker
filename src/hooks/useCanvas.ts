import { useState, useRef, useEffect, useCallback } from 'react';
import { type Marker, type CanvasDimensions } from '@/lib/types';
import { drawMarker } from '@/utils/canvasUtils';
import { calculateCanvasDimensions } from '@/utils/imageUtils';

export const useCanvas = (
  image: HTMLImageElement | null, 
  markers: Marker[], 
  hoveredMarkerId: string | null,
  onMarkersScale?: (scaleFn: (markers: Marker[]) => Marker[]) => void
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: 800,
    height: 600,
  });
  const prevDimensionsRef = useRef<CanvasDimensions | null>(null);

  // Draw image and all markers on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image if loaded
    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    // Draw all markers
    markers.forEach((marker) => {
      const isHovered = marker.id === hoveredMarkerId;
      drawMarker(ctx, marker, isHovered);
    });
  }, [image, markers, hoveredMarkerId]);

  // Update canvas dimensions when image changes and trigger redraw
  useEffect(() => {
    if (image) {
      const dimensions = calculateCanvasDimensions(image);
      setCanvasDimensions(dimensions);
      prevDimensionsRef.current = dimensions; // Store initial dimensions
      // Trigger redraw after dimensions are set
      setTimeout(redrawCanvas, 10);
    }
  }, [image, redrawCanvas]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle window resize for responsive canvas with debouncing and marker scaling
  useEffect(() => {
    let timeoutId: number;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (image && prevDimensionsRef.current && onMarkersScale) {
          const newDimensions = calculateCanvasDimensions(image);
          const oldDimensions = prevDimensionsRef.current;
          
          // Calculate scale factors
          const scaleX = newDimensions.width / oldDimensions.width;
          const scaleY = newDimensions.height / oldDimensions.height;
          
          // Scale all marker positions
          onMarkersScale((markers) =>
            markers.map(marker => ({
              ...marker,
              x: marker.x * scaleX,
              y: marker.y * scaleY,
            }))
          );
          
          setCanvasDimensions(newDimensions);
          prevDimensionsRef.current = newDimensions;
          // Trigger redraw after dimensions change
          setTimeout(redrawCanvas, 10);
        } else if (image) {
          const dimensions = calculateCanvasDimensions(image);
          setCanvasDimensions(dimensions);
          prevDimensionsRef.current = dimensions;
          setTimeout(redrawCanvas, 10);
        }
      }, 100); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [image, redrawCanvas, onMarkersScale]);

  // Method to restore canvas dimensions from session
  const restoreCanvasDimensions = useCallback((dimensions: CanvasDimensions) => {
    setCanvasDimensions(dimensions);
    prevDimensionsRef.current = dimensions;
  }, []);

  return {
    canvasRef,
    canvasDimensions,
    redrawCanvas,
    restoreCanvasDimensions,
  };
};