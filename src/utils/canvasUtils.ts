import { type Marker } from '@/lib/types';

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const drawMarker = (
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
    if (borderSize > 0) {
      ctx.stroke();
    }
  } else {
    // Square
    ctx.fillRect(x - size, y - size, size * 2, size * 2);
    if (borderSize > 0) {
      ctx.strokeRect(x - size, y - size, size * 2, size * 2);
    }
  }

  // Draw text if enabled and text exists
  if (showText && text && text.trim()) {
    ctx.fillStyle = textColor || '#ffffff';
    ctx.font = `${fontSize || 12}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text stroke for better visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
  }

  // Draw count if enabled (mutually exclusive with text)
  if (showCount && count !== undefined && !showText) {
    ctx.fillStyle = countColor || '#ffffff';
    ctx.font = `${countFontSize || 14}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text stroke for better visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeText(count.toString(), x, y);
    ctx.fillText(count.toString(), x, y);
  }

  ctx.restore();
};

export const getCanvasCoordinates = (
  event: React.MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return { x, y };
};

export const getCanvasCoordinatesFromTouch = (
  event: React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
) => {
  const rect = canvas.getBoundingClientRect();
  const touch = event.touches[0] || event.changedTouches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  return { x, y };
};

export const isPointInMarker = (x: number, y: number, marker: Marker): boolean => {
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

export const getMarkerAtPosition = (x: number, y: number, markers: Marker[]): Marker | null => {
  // Check in reverse order (topmost marker first)
  for (let i = markers.length - 1; i >= 0; i--) {
    if (isPointInMarker(x, y, markers[i])) {
      return markers[i];
    }
  }
  return null;
};