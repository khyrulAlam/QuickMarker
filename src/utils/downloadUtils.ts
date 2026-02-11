import { type Marker, type CanvasDimensions } from '@/lib/types';
import { drawMarker } from './canvasUtils';

export const downloadAnnotatedImage = async (
  image: HTMLImageElement,
  markers: Marker[],
  canvasDimensions: CanvasDimensions
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Create high-resolution canvas for download
    const downloadCanvas = document.createElement('canvas');
    const downloadCtx = downloadCanvas.getContext('2d');
    
    if (!downloadCtx) {
      reject(new Error('Failed to create download canvas'));
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
        reject(new Error('Failed to create image'));
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = Date.now();
      link.download = `annotated-image-${timestamp}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      resolve();
    }, 'image/png', 1.0); // Maximum quality
  });
};