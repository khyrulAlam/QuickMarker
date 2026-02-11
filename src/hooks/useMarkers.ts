import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { type Marker, type MarkerSettings } from '@/lib/types';

export const useMarkers = () => {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  const addMarker = useCallback((x: number, y: number, settings: MarkerSettings) => {
    const newMarker: Marker = {
      id: crypto.randomUUID(),
      x,
      y,
      ...settings,
      // Add sequential count if count mode is enabled
      count: settings.showCount ? markers.length + settings.countStartFrom : undefined,
    };

    setMarkers((prev) => [...prev, newMarker]);
  }, [markers.length]);

  const removeMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== markerId));
    setHoveredMarkerId(null);
    toast.info('Marker deleted');
  }, []);

  const undoLastMarker = useCallback(() => {
    if (markers.length === 0) return;
    setMarkers((prev) => prev.slice(0, -1));
    toast.info('Last marker removed');
  }, [markers.length]);

  const clearAllMarkers = useCallback(() => {
    setMarkers([]);
    setHoveredMarkerId(null);
    toast.info('All markers cleared');
  }, []);

  const resetMarkersOnNewImage = useCallback(() => {
    setMarkers([]);
    setHoveredMarkerId(null);
  }, []);

  const scaleMarkers = useCallback((scaleFn: (markers: Marker[]) => Marker[]) => {
    setMarkers(scaleFn);
  }, []);

  return {
    markers,
    hoveredMarkerId,
    setHoveredMarkerId,
    addMarker,
    removeMarker,
    undoLastMarker,
    clearAllMarkers,
    resetMarkersOnNewImage,
    scaleMarkers,
  };
};