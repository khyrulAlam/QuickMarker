import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, Undo } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Marker, type MarkerSettings, type CanvasDimensions } from '@/lib/types';
import ControlPanel from './ControlPanel';

const MAX_CANVAS_WIDTH = 900;

export default function ImageAnnotator() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: MAX_CANVAS_WIDTH,
    height: 600,
  });

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate canvas dimensions based on image aspect ratio
  const calculateCanvasDimensions = useCallback((img: HTMLImageElement): CanvasDimensions => {
    const aspectRatio = img.height / img.width;
    const width = Math.min(img.width, MAX_CANVAS_WIDTH);
    const height = width * aspectRatio;
    return { width, height };
  }, []);

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

  // Draw individual marker
  const drawMarker = (
    ctx: CanvasRenderingContext2D,
    marker: Marker,
    isHovered: boolean = false
  ) => {
    const { x, y, shape, size, color, borderSize, borderColor, opacity, text, textColor, fontSize, showText, count, showCount, countColor, countFontSize } = marker;

    ctx.save();

    // Set fill style with opacity
    const rgb = hexToRgb(color);
    if (rgb) {
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
    }

    // Set stroke style
    ctx.strokeStyle = isHovered ? '#ffff00' : borderColor;
    ctx.lineWidth = isHovered ? borderSize + 2 : borderSize;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'square') {
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
      ctx.strokeRect(x - size, y - size, size * 2, size * 2);
    }

    // Draw count if enabled (mutually exclusive with text)
    if (showCount && count !== undefined) {
      ctx.fillStyle = countColor || '#ffffff';
      ctx.font = `${countFontSize || 14}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text stroke for better readability
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeText(count.toString(), x, y);
      ctx.fillText(count.toString(), x, y);
    }
    // Draw text if enabled and count is not shown (mutually exclusive)
    else if (showText && text && text.trim()) {
      ctx.fillStyle = textColor || '#ffffff';
      ctx.font = `${fontSize || 12}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add text stroke for better readability
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
    }

    ctx.restore();
  };

  // Convert hex color to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setMarkers([]); // Clear markers when new image is loaded
        const dimensions = calculateCanvasDimensions(img);
        setCanvasDimensions(dimensions);
        toast.success('Image loaded successfully');
      };
      img.onerror = () => {
        toast.error('Failed to load image');
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Get canvas coordinates from mouse event
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return { x, y };
  };

  // Get canvas coordinates from touch event
  const getCanvasCoordinatesFromTouch = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    return { x, y };
  };

  // Check if a point is inside a marker
  const isPointInMarker = (x: number, y: number, marker: Marker): boolean => {
    if (marker.shape === 'circle') {
      const distance = Math.sqrt((x - marker.x) ** 2 + (y - marker.y) ** 2);
      return distance <= marker.size;
    } else {
      // Square
      return (
        x >= marker.x - marker.size &&
        x <= marker.x + marker.size &&
        y >= marker.y - marker.size &&
        y <= marker.y + marker.size
      );
    }
  };

  // Get marker at position (for hover and click detection)
  const getMarkerAtPosition = (x: number, y: number): Marker | null => {
    // Check in reverse order (topmost marker first)
    for (let i = markers.length - 1; i >= 0; i--) {
      if (isPointInMarker(x, y, markers[i])) {
        return markers[i];
      }
    }
    return null;
  };

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    // Check if clicking on existing marker to delete it
    const clickedMarker = getMarkerAtPosition(coords.x, coords.y);
    if (clickedMarker) {
      setMarkers((prev) => prev.filter((m) => m.id !== clickedMarker.id));
      setHoveredMarkerId(null);
      toast.info('Marker deleted');
      return;
    }

    // Place new marker
    const newMarker: Marker = {
      id: crypto.randomUUID(),
      x: coords.x,
      y: coords.y,
      ...markerSettings,
      // Add sequential count if count mode is enabled
      count: markerSettings.showCount ? markers.length + markerSettings.countStartFrom : undefined,
    };

    setMarkers((prev) => [...prev, newMarker]);
  };

  // Handle canvas mouse move (for hover effect)
  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!image) return;

    const coords = getCanvasCoordinates(event);
    if (!coords) return;

    const marker = getMarkerAtPosition(coords.x, coords.y);
    setHoveredMarkerId(marker ? marker.id : null);

    // Change cursor style
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = marker ? 'pointer' : 'crosshair';
    }
  };

  // Handle canvas mouse leave
  const handleCanvasMouseLeave = () => {
    setHoveredMarkerId(null);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  // Handle touch start (for placing markers on mobile)
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    if (!image) return;

    event.preventDefault(); // Prevent default touch behavior

    const coords = getCanvasCoordinatesFromTouch(event);
    if (!coords) return;

    // Check if touching existing marker to delete it
    const touchedMarker = getMarkerAtPosition(coords.x, coords.y);
    if (touchedMarker) {
      setMarkers((prev) => prev.filter((m) => m.id !== touchedMarker.id));
      toast.info('Marker deleted');
      return;
    }

    // Place new marker
    const newMarker: Marker = {
      id: crypto.randomUUID(),
      x: coords.x,
      y: coords.y,
      ...markerSettings,
      // Add sequential count if count mode is enabled
      count: markerSettings.showCount ? markers.length + markerSettings.countStartFrom : undefined,
    };

    setMarkers((prev) => [...prev, newMarker]);
  };

  // Clear all markers
  const clearAllMarkers = () => {
    setMarkers([]);
    toast.info('All markers cleared');
  };

  // Reset count numbers
  const resetCount = () => {
    setMarkers((prev) => 
      prev.map((marker, index) => ({
        ...marker,
        count: marker.showCount ? index + markerSettings.countStartFrom : marker.count,
      }))
    );
    toast.info('Count numbers reset');
  };

  // Undo last marker
  const undoLastMarker = () => {
    if (markers.length === 0) return;
    setMarkers((prev) => prev.slice(0, -1));
    toast.info('Last marker removed');
  };

  // Handle download with high resolution
  const handleDownload = async () => {
    if (!image) return;

    setIsDownloading(true);
    try {
      // Create high-resolution canvas for download
      const downloadCanvas = document.createElement('canvas');
      const downloadCtx = downloadCanvas.getContext('2d');
      if (!downloadCtx) {
        toast.error('Failed to create download canvas');
        setIsDownloading(false);
        return;
      }

      // Use the original image dimensions for better quality
      downloadCanvas.width = image.naturalWidth;
      downloadCanvas.height = image.naturalHeight;

      // Draw the original image at full resolution
      downloadCtx.drawImage(image, 0, 0);

      // Scale factor for markers
      const markerScale = downloadCanvas.width / canvasDimensions.width;

      // Draw all markers at scaled positions
      markers.forEach((marker) => {
        const scaledMarker = {
          ...marker,
          x: marker.x * markerScale,
          y: marker.y * markerScale,
          size: marker.size * markerScale,
          borderSize: marker.borderSize * markerScale,
          fontSize: (marker.fontSize || 12) * markerScale,
          countFontSize: (marker.countFontSize || 14) * markerScale,
        };
        drawMarker(downloadCtx, scaledMarker);
      });

      // Convert to blob and download
      downloadCanvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          setIsDownloading(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = Date.now();
        link.download = `annotated-image-${timestamp}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);

        toast.success('High quality image downloaded successfully');
        setIsDownloading(false);
      }, 'image/png', 1.0); // Maximum quality
    } catch (error) {
      toast.error('Failed to download image');
      setIsDownloading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Z: Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undoLastMarker();
      }
      // Delete/Backspace: Remove last marker
      else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (markers.length > 0 && document.activeElement === document.body) {
          event.preventDefault();
          undoLastMarker();
        }
      }
      // Ctrl/Cmd + S: Download
      else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (image) {
          handleDownload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [markers, image]);

  // Redraw canvas when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <TooltipProvider>
      <div className="flex flex-col lg:flex-row gap-6 w-full">
        {/* Main Canvas Area */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Image Annotator</CardTitle>
                <Badge variant="secondary">{markers.length} markers</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* File upload */}
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Upload image"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </Button>
                </div>

                {/* Canvas or placeholder */}
                <div className="border rounded-lg overflow-hidden bg-muted/10">
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
                          className="max-w-full h-auto touch-none"
                          style={{ cursor: 'crosshair' }}
                          aria-label="Image canvas with markers"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to place marker • Click marker to delete</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 mb-2 opacity-50" />
                        <p>No image loaded</p>
                        <p className="text-sm">Upload an image to start annotating</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={undoLastMarker}
                    disabled={markers.length === 0}
                    variant="outline"
                    aria-label="Undo last marker"
                  >
                    <Undo className="mr-2 h-4 w-4" />
                    Undo Last
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={markers.length === 0} variant="destructive">
                        Clear All Markers
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Markers?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. All markers will be permanently removed from
                          the canvas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearAllMarkers}>
                          Clear All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    onClick={handleDownload}
                    disabled={!image || isDownloading}
                    className="ml-auto"
                    aria-label="Download annotated image"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading ? 'Downloading...' : 'Download Image'}
                  </Button>
                </div>

                {/* Keyboard shortcuts hint */}
                <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/50 rounded-md">
                  <p className="font-medium">Keyboard Shortcuts:</p>
                  <p>• Ctrl/Cmd + Z: Undo last marker</p>
                  <p>• Delete/Backspace: Remove last marker</p>
                  <p>• Ctrl/Cmd + S: Download image</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="lg:w-80">
          <ControlPanel
            settings={markerSettings}
            onSettingsChange={setMarkerSettings}
            markerCount={markers.length}
            onResetCount={resetCount}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
