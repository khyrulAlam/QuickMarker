import { type Marker, type CanvasDimensions } from '@/lib/types';
import { drawMarker } from './canvasUtils';

/**
 * Maximum canvas size to prevent memory issues
 * Large canvases can consume excessive memory
 */
const MAX_DOWNLOAD_CANVAS_SIZE = 8192; // 8K max dimension

/**
 * Downloads annotated image with proper memory management
 * Includes canvas cleanup and memory optimization
 */
export const downloadAnnotatedImage = async (
  image: HTMLImageElement,
  markers: Marker[],
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let downloadCanvas: HTMLCanvasElement | null = null;
    let downloadCtx: CanvasRenderingContext2D | null = null;
    let downloadUrl: string | null = null;
    
    // Memory cleanup function
    const cleanup = () => {
      try {
        // Revoke blob URL to free memory
        if (downloadUrl) {
          URL.revokeObjectURL(downloadUrl);
          downloadUrl = null;
        }
        
        // Clear canvas context and set small size to free GPU memory
        if (downloadCtx) {
          downloadCtx.clearRect(0, 0, downloadCanvas!.width, downloadCanvas!.height);
        }
        
        if (downloadCanvas) {
          // Force canvas size to minimum to free GPU memory
          downloadCanvas.width = 1;
          downloadCanvas.height = 1;
          downloadCanvas = null;
        }
        
        downloadCtx = null;
        
        // Suggest garbage collection (only works in dev tools)
        if (typeof window !== 'undefined' && 'gc' in window) {
          (window as any).gc();
        }
      } catch (error) {
        console.warn('Canvas cleanup warning:', error);
      }
    };

    try {
      // Create high-resolution canvas for download
      downloadCanvas = document.createElement('canvas');
      downloadCtx = downloadCanvas.getContext('2d', {
        // Optimize canvas context for performance
        alpha: false, // No transparency needed for final image
        desynchronized: true, // Allow async rendering
      });
      
      if (!downloadCtx) {
        cleanup();
        reject(new Error('Failed to create download canvas context'));
        return;
      }

      // Calculate optimal dimensions with size limits
      let targetWidth = image.naturalWidth;
      let targetHeight = image.naturalHeight;
      
      // Scale down if image is too large to prevent memory issues
      if (targetWidth > MAX_DOWNLOAD_CANVAS_SIZE || targetHeight > MAX_DOWNLOAD_CANVAS_SIZE) {
        const scale = Math.min(
          MAX_DOWNLOAD_CANVAS_SIZE / targetWidth,
          MAX_DOWNLOAD_CANVAS_SIZE / targetHeight
        );
        targetWidth = Math.floor(targetWidth * scale);
        targetHeight = Math.floor(targetHeight * scale);
        
        console.info(`Image scaled down for download: ${image.naturalWidth}x${image.naturalHeight} → ${targetWidth}x${targetHeight}`);
      }

      // Set canvas dimensions
      downloadCanvas.width = targetWidth;
      downloadCanvas.height = targetHeight;

      // Draw the image at optimal resolution
      downloadCtx.drawImage(image, 0, 0, targetWidth, targetHeight);

      // Scale factor for markers based on actual canvas size
      const markerScale = targetWidth / canvasDimensions.width;

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
        drawMarker(downloadCtx!, scaledMarker);
      });

      // Convert to blob and download
      downloadCanvas.toBlob((blob) => {
        try {
          if (!blob) {
            cleanup();
            reject(new Error('Failed to create image blob'));
            return;
          }

          downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const timestamp = Date.now();
          link.download = `annotated-image-${timestamp}.png`;
          link.href = downloadUrl;
          
          // Trigger download
          link.click();
          
          // Cleanup after download with small delay to ensure download starts
          setTimeout(() => {
            cleanup();
            resolve();
          }, 100);
          
        } catch (error) {
          cleanup();
          reject(error);
        }
      }, 'image/png', 1.0); // Maximum quality
      
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
};