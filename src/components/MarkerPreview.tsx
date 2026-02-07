import { useEffect, useRef } from 'react';
import { type MarkerSettings } from '@/lib/types';

interface MarkerPreviewProps {
  settings: MarkerSettings;
}

export default function MarkerPreview({ settings }: MarkerPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw marker at center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const { shape, size, color, borderSize, borderColor, opacity } = settings;

    ctx.save();

    // Convert hex to rgba
    const rgb = hexToRgb(color);
    if (rgb) {
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity / 100})`;
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderSize;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, centerY, size, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'square') {
      ctx.fillRect(centerX - size, centerY - size, size * 2, size * 2);
      ctx.strokeRect(centerX - size, centerY - size, size * 2, size * 2);
    }

    ctx.restore();
  }, [settings]);

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

  return (
    <div className="border rounded-md overflow-hidden bg-muted/30">
      <canvas
        ref={canvasRef}
        width={200}
        height={120}
        className="w-full"
        aria-label="Marker style preview"
      />
    </div>
  );
}
