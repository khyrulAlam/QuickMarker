import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type Marker, type MarkerSettings, type CanvasDimensions } from '@/lib/types';
import { FloatingToolbar } from './FloatingToolbar';
import { ImageIcon } from 'lucide-react';

const TOOLBAR_HEIGHT = 80; // Space for floating toolbar

export default function ImageAnnotator() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState<CanvasDimensions>({
    width: 800,
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

  // Calculate canvas dimensions for full viewport while maintaining aspect ratio
  const calculateCanvasDimensions = useCallback((img: HTMLImageElement): CanvasDimensions => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight - TOOLBAR_HEIGHT;
    
    const imageAspectRatio = img.width / img.height;
    const viewportAspectRatio = viewportWidth / viewportHeight;
    
    let width: number;
    let height: number;
    
    if (imageAspectRatio > viewportAspectRatio) {
      // Image is wider than viewport - fit to width
      width = viewportWidth * 0.9; // Leave some margin
      height = width / imageAspectRatio;
    } else {
      // Image is taller than viewport - fit to height  
      height = viewportHeight * 0.9; // Leave some margin
      width = height * imageAspectRatio;
    }
    
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

  // Process image file (shared between upload and drag & drop)
  const processImageFile = (file: File) => {
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

  // Handle image upload from file input
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  // Handle drag and drop events
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
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

  // Handle window resize for responsive canvas with debouncing
  useEffect(() => {
    let timeoutId: number;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (image) {
          const dimensions = calculateCanvasDimensions(image);
          setCanvasDimensions(dimensions);
          // Trigger redraw after dimensions change
          setTimeout(redrawCanvas, 10);
        }
      }, 100); // Debounce resize events
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [image, calculateCanvasDimensions, redrawCanvas]);

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
          onUpload={() => fileInputRef.current?.click()}
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
