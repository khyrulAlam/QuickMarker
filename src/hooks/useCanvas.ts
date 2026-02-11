import { useState, useRef, useEffect, useCallback } from 'react';
import { type Marker, type CanvasDimensions } from '@/lib/types';
import { drawMarker, getMarkerVisualHash } from '@/utils/canvasUtils';
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
  
  // Performance tracking refs
  const prevMarkersRef = useRef<Marker[]>([]);
  const prevHoveredIdRef = useRef<string | null>(null);
  const prevImageRef = useRef<HTMLImageElement | null>(null);
  const prevMarkerHashesRef = useRef<Map<string, string>>(new Map());
  const lastRedrawTimeRef = useRef<number>(0);
  const redrawRequestRef = useRef<number | null>(null);

  // Optimized canvas redraw with dirty region detection
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    
    // Throttle redraws to 60fps maximum
    const timeSinceLastRedraw = now - lastRedrawTimeRef.current;
    if (timeSinceLastRedraw < 16) { // ~60fps
      // Schedule a redraw for later
      if (!redrawRequestRef.current) {
        redrawRequestRef.current = requestAnimationFrame(() => {
          redrawRequestRef.current = null;
          redrawCanvas();
        });
      }
      return;
    }
    
    // Check if we need to redraw (hash-based dirty region detection)
    const needsFullRedraw = (
      prevImageRef.current !== image ||
      prevMarkersRef.current.length !== markers.length ||
      markers.some((marker) => {
        const prevHash = prevMarkerHashesRef.current.get(marker.id);
        const currentHash = getMarkerVisualHash(marker);
        return prevHash !== currentHash;
      })
    );
    
    const hoveredChanged = prevHoveredIdRef.current !== hoveredMarkerId;
    
    if (!needsFullRedraw && !hoveredChanged) {
      return; // No changes detected, skip redraw
    }
    
    // Update performance tracking
    lastRedrawTimeRef.current = now;
    
    // Clear canvas efficiently
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

    // Update refs for next comparison
    prevImageRef.current = image;
    prevMarkersRef.current = [...markers]; // Shallow copy for comparison
    prevHoveredIdRef.current = hoveredMarkerId;

    // Update hash map for next comparison
    prevMarkerHashesRef.current.clear();
    markers.forEach((marker) => {
      prevMarkerHashesRef.current.set(marker.id, getMarkerVisualHash(marker));
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

  // Intelligent redraw scheduling
  useEffect(() => {
    // Cancel any pending redraw request
    if (redrawRequestRef.current) {
      cancelAnimationFrame(redrawRequestRef.current);
      redrawRequestRef.current = null;
    }
    
    // Schedule redraw using requestAnimationFrame for smooth performance
    redrawRequestRef.current = requestAnimationFrame(() => {
      redrawRequestRef.current = null;
      redrawCanvas();
    });
    
    return () => {
      if (redrawRequestRef.current) {
        cancelAnimationFrame(redrawRequestRef.current);
        redrawRequestRef.current = null;
      }
    };
  }, [redrawCanvas]);

  // Handle window resize for responsive canvas with debouncing and marker scaling
  useEffect(() => {
    let timeoutId: number | null = null;
    
    const handleResize = () => {
      // Clear existing timer
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      timeoutId = window.setTimeout(() => {
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
          
          // Trigger immediate redraw after dimensions change
          requestAnimationFrame(redrawCanvas);
        } else if (image) {
          const dimensions = calculateCanvasDimensions(image);
          setCanvasDimensions(dimensions);
          prevDimensionsRef.current = dimensions;
          
          // Trigger immediate redraw
          requestAnimationFrame(redrawCanvas);
        }
        
        timeoutId = null;
      }, 100); // Debounce resize events
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      // Clear timer on cleanup
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
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