import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageIcon } from 'lucide-react';
import { type MarkerSettings } from '@/lib/types';
import { FloatingToolbar } from './FloatingToolbar';
import { useMarkers } from '@/hooks/useMarkers';
import { useCanvas } from '@/hooks/useCanvas';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getCanvasCoordinates, getCanvasCoordinatesFromTouch, getMarkerAtPosition } from '@/utils/canvasUtils';
import { downloadAnnotatedImage } from '@/utils/downloadUtils';

export default function ImageAnnotator() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [markerSettings, setMarkerSettings] = useState<MarkerSettings>({
    shape: 'circle',
    size: 20,
    color: '#ff0000',
    borderSize: 2,
    borderColor: '#000000',
    opacity: 50,
    text: '',
    textColor: '#ffffff',
    fontSize: 12,
    showText: false,
    showCount: false,
    countColor: '#ffffff',
    countFontSize: 14,
    countStartFrom: 1,
  });

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
  } = useMarkers();

  const { image, fileInputRef, handleImageUpload, handleDragOver, handleDrop, triggerUpload } = useImageUpload(
    () => {
      resetMarkersOnNewImage();
    }
  );

  const { canvasRef, canvasDimensions } = useCanvas(image, markers, hoveredMarkerId, scaleMarkers);

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
    setMarkerSettings(prev => ({
      ...prev,
      countStartFrom: 1
    }));
  };

  // Canvas interaction handlers
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    if (!coords) return;

    // Check if clicking on existing marker to delete it
    const clickedMarker = getMarkerAtPosition(coords.x, coords.y, markers);
    if (clickedMarker) {
      removeMarker(clickedMarker.id);
      return;
    }

    // Place new marker
    addMarker(coords.x, coords.y, markerSettings);
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinates(event, canvas);
    if (!coords) return;

    const marker = getMarkerAtPosition(coords.x, coords.y, markers);
    setHoveredMarkerId(marker ? marker.id : null);

    // Change cursor style
    canvas.style.cursor = marker ? 'pointer' : 'crosshair';
  };

  const handleCanvasMouseLeave = () => {
    setHoveredMarkerId(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!image) return;

    event.preventDefault(); // Prevent default touch behavior

    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCanvasCoordinatesFromTouch(event, canvas);
    if (!coords) return;

    // Check if touching existing marker to delete it
    const touchedMarker = getMarkerAtPosition(coords.x, coords.y, markers);
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