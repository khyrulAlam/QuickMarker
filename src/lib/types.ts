// Marker shape options
export type MarkerShape = 'circle' | 'square';

// Individual marker properties
export interface Marker {
  id: string;
  x: number;
  y: number;
  shape: MarkerShape;
  size: number;
  color: string;
  borderSize: number;
  borderColor: string;
  opacity: number;
  text?: string;
  textColor?: string;
  fontSize?: number;
  showText?: boolean;
}

// Marker settings (current tool configuration)
export interface MarkerSettings {
  shape: MarkerShape;
  size: number;
  color: string;
  borderSize: number;
  borderColor: string;
  opacity: number;
  text: string;
  textColor: string;
  fontSize: number;
  showText: boolean;
}

// Image state
export interface ImageState {
  image: HTMLImageElement | null;
  scale: number;
  offsetX: number;
  offsetY: number;
}

// Canvas dimensions
export interface CanvasDimensions {
  width: number;
  height: number;
}
