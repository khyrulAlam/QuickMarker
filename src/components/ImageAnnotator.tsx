import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageIcon } from 'lucide-react';
import { FloatingToolbar } from './FloatingToolbar';
import { useMarkers } from '@/hooks/useMarkers';
import { useCanvas } from '@/hooks/useCanvas';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePersistedSettings } from '@/hooks/usePersistedSettings';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { getCanvasCoordinates, getCanvasCoordinatesFromTouch, getMarkerAtPosition } from '@/utils/canvasUtils';
import { createSpatialIndex, type SpatialIndex } from '@/utils/spatialIndex';
import { downloadAnnotatedImage } from '@/utils/downloadUtils';
import * as sessionService from '@/services/sessionService';

export default function ImageAnnotator() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [spatialIndex, setSpatialIndex] = useState<SpatialIndex | null>(null);
  const initializationAttemptedRef = useRef(false);
  
  // Persistent settings hook replaces local state
  const {
    settings: markerSettings,
    updateSettings: setMarkerSettings,
  } = usePersistedSettings();
  
  // Session persistence hook for auto-save and restoration
  const {
    updateMarkers: saveMarkers,
    updateCanvasDimensions: saveCanvasDimensions,
    initializeSession,
  } = useSessionPersistence();

  // Custom hooks
  const {
    markers,
    hoveredMarkerId,
    setHoveredMarkerId,
    addMarker,
    removeMarker,
    undoLastMarker,
    clearAllMarkers,
    resetMarkersOnNewImage,
    scaleMarkers,
    restoreMarkers,
  } = useMarkers();

  const { image, fileInputRef, handleImageUpload, handleDragOver, handleDrop, triggerUpload, restoreImage } = useImageUpload(
    async (uploadedImage: HTMLImageElement, imageName: string) => {
      resetMarkersOnNewImage();
      // Create new session when image is uploaded
      try {
        await sessionService.createNewSession(uploadedImage, imageName, canvasDimensions);
      } catch (error: any) {
        console.error('Failed to create new session:', error);
        toast.error('Failed to save session');
      }
    }
  );

  const { canvasRef, canvasDimensions, restoreCanvasDimensions } = useCanvas(image, markers, hoveredMarkerId, scaleMarkers);
  
  // Initialize spatial index when canvas dimensions are available
  useEffect(() => {
    if (canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      const newSpatialIndex = createSpatialIndex(canvasDimensions.width, canvasDimensions.height);
      if (markers.length > 0) {
        newSpatialIndex.addMarkers(markers);
      }
      setSpatialIndex(newSpatialIndex);
    }
  }, [canvasDimensions.width, canvasDimensions.height]);

  // Update spatial index when markers change
  useEffect(() => {
    if (spatialIndex && markers.length >= 0) {
      spatialIndex.rebuildIndex(markers);
    }
  }, [markers, spatialIndex]);
  
  // Update spatial index when canvas dimensions change during resize
  useEffect(() => {
    if (spatialIndex && canvasDimensions.width > 0 && canvasDimensions.height > 0) {
      spatialIndex.updateDimensions(canvasDimensions.width, canvasDimensions.height);
    }
  }, [spatialIndex, canvasDimensions.width, canvasDimensions.height]);
  
  // Initialize session on component mount
  useEffect(() => {
    // Prevent duplicate initialization (React Strict Mode protection)
    if (initializationAttemptedRef.current) return;
    initializationAttemptedRef.current = true;
    
    const initSession = async () => {
      try {
        const restored = await initializeSession();
        if (restored) {
          // Restore the session data to the UI
          restoreImage(restored.image);
          restoreMarkers(restored.markers);
          restoreCanvasDimensions(restored.canvasDimensions);
        }
      } catch (error: any) {
        console.error('Session initialization failed:', error);
      }
    };
    
    initSession();
  }, [initializeSession, restoreImage, restoreMarkers, restoreCanvasDimensions]);
  
  // Auto-save markers when they change
  useEffect(() => {
    if (image && markers.length >= 0) {
      saveMarkers(markers);
    }
  }, [markers, saveMarkers, image]);
  
  // Update canvas dimensions in session when they change
  useEffect(() => {
    if (image && canvasDimensions) {
      saveCanvasDimensions(canvasDimensions).catch((error: any) => {
        console.error('Failed to update canvas dimensions:', error);
      });
    }
  }, [canvasDimensions, saveCanvasDimensions, image]);
  
  // Cleanup mouse move timeout on unmount
  useEffect(() => {
    return () => {
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
        mouseMoveTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle download with loading state
  const handleDownload = async () => {
    if (!image) return;

    setIsDownloading(true);
    try {
      await downloadAnnotatedImage(image, markers, canvasDimensions);
      toast.success('High quality image downloaded successfully');
    } catch (error) {
      toast.error('Failed to download image');
    } finally {
      setIsDownloading(false);
    }
  };

  // Reset count functionality
  const resetCount = () => {
    setMarkerSettings({ countStartFrom: 1 });
  };

  // Canvas interaction handlers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    if (!coords) return;

    // Check if clicking on existing marker to delete it
    const clickedMarker = spatialIndex ? 
      spatialIndex.getMarkerAtPosition(coords.x, coords.y) : 
      getMarkerAtPosition(coords.x, coords.y, markers);
    if (clickedMarker) {
      removeMarker(clickedMarker.id);
      return;
    }

    // Place new marker
    addMarker(coords.x, coords.y, markerSettings);
  };

  // Throttled mouse move handler for better performance
  const mouseMoveTimeoutRef = useRef<number | null>(null);
  const lastMouseMoveTimeRef = useRef<number>(0);
  const MOUSE_MOVE_THROTTLE_MS = 16; // ~60fps (1000ms / 60fps = 16.67ms)
  
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const now = performance.now();
    const timeSinceLastMove = now - lastMouseMoveTimeRef.current;
    
    // Clear existing timeout
    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
      mouseMoveTimeoutRef.current = null;
    }
    
    const processMouseMove = () => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;

      const coords = getCanvasCoordinates(event, canvas);
      if (!coords) return;

      const marker = spatialIndex ? 
        spatialIndex.getMarkerAtPosition(coords.x, coords.y) : 
        getMarkerAtPosition(coords.x, coords.y, markers);
      setHoveredMarkerId(marker ? marker.id : null);

      // Change cursor style
      canvas.style.cursor = marker ? 'pointer' : 'crosshair';
      
      lastMouseMoveTimeRef.current = performance.now();
    };
    
    // If enough time has passed, process immediately
    if (timeSinceLastMove >= MOUSE_MOVE_THROTTLE_MS) {
      processMouseMove();
    } else {
      // Otherwise, throttle the update
      const remainingTime = MOUSE_MOVE_THROTTLE_MS - timeSinceLastMove;
      mouseMoveTimeoutRef.current = window.setTimeout(() => {
        processMouseMove();
        mouseMoveTimeoutRef.current = null;
      }, remainingTime);
    }
  }, [image, markers, canvasRef]);

  const handleCanvasMouseLeave = useCallback(() => {
    // Clear any pending mouse move updates
    if (mouseMoveTimeoutRef.current) {
      clearTimeout(mouseMoveTimeoutRef.current);
      mouseMoveTimeoutRef.current = null;
    }
    
    setHoveredMarkerId(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
  }, []);

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!image) return;

    event.preventDefault(); // Prevent default touch behavior

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinatesFromTouch(event, canvas);
    if (!coords) return;

    // Check if touching existing marker to delete it
    const touchedMarker = spatialIndex ? 
      spatialIndex.getMarkerAtPosition(coords.x, coords.y) : 
      getMarkerAtPosition(coords.x, coords.y, markers);
    if (touchedMarker) {
      removeMarker(touchedMarker.id);
      return;
    }

    // Place new marker
    addMarker(coords.x, coords.y, markerSettings);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: undoLastMarker,
    onDownload: handleDownload,
    hasMarkers: markers.length > 0,
    hasImage: !!image,
  });

  return (
    <TooltipProvider>
      <div 
        className="relative w-screen h-screen bg-background overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-label="Upload image"
        />

        {/* Floating Toolbar */}
        <FloatingToolbar
          onUpload={triggerUpload}
          onDownload={handleDownload}
          onUndo={undoLastMarker}
          onClearAll={clearAllMarkers}
          markerCount={markers.length}
          hasImage={!!image}
          isDownloading={isDownloading}
          hasMarkers={markers.length > 0}
          markerSettings={markerSettings}
          onSettingsChange={setMarkerSettings}
          onResetCount={resetCount}
        />

        {/* Full Screen Canvas Area */}
        <div className="absolute inset-0 pt-20 flex items-center justify-center">
          {image ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <canvas
                  ref={canvasRef}
                  width={canvasDimensions.width}
                  height={canvasDimensions.height}
                  onClick={handleCanvasClick}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseLeave={handleCanvasMouseLeave}
                  onTouchStart={handleTouchStart}
                  className="touch-none border rounded-lg shadow-lg"
                  style={{ cursor: 'crosshair' }}
                  aria-label="Image canvas with markers"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to place marker • Click marker to delete</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center justify-center h-64 w-64 rounded-lg text-muted-foreground">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 mb-2 opacity-50 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
                <p>No image loaded</p>
                <p className="text-sm">Use Upload button or drag and drop to start</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}