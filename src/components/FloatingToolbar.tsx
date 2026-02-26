import { memo, useMemo } from 'react';
import { Download, Upload, Undo, Trash2, Info, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ThemeToggle } from './ThemeToggle';
import ControlPanel from './ControlPanel';
import { type MarkerSettings } from '@/lib/types';

interface FloatingToolbarProps {
  onUpload: () => void;
  onDownload: () => void;
  onUndo: () => void;
  onClearAll: () => void;
  onClearCanvas: () => void;
  markerCount: number;
  hasImage: boolean;
  isDownloading: boolean;
  hasMarkers: boolean;
  markerSettings: MarkerSettings;
  onSettingsChange: (settings: MarkerSettings) => void;
  onResetCount: () => void;
}

function FloatingToolbarComponent({
  onUpload,
  onDownload,
  onUndo,
  onClearAll,
  onClearCanvas,
  markerCount,
  hasImage,
  isDownloading,
  hasMarkers,
  markerSettings,
  onSettingsChange,
  onResetCount,
}: FloatingToolbarProps) {
  // Memoize computed values to prevent unnecessary re-renders
  const markerCountText = useMemo(() => `${markerCount} markers`, [markerCount]);
  
  const downloadButtonText = useMemo(() => {
    return isDownloading ? 'Downloading...' : 'Download';
  }, [isDownloading]);
  
  const isDownloadDisabled = useMemo(() => {
    return !hasImage || isDownloading;
  }, [hasImage, isDownloading]);
  
  // Memoize keyboard shortcuts content to prevent re-creation
  const keyboardShortcuts = useMemo(() => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm">Keyboard Shortcuts</h4>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>Undo last marker</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd>
        </div>
        <div className="flex justify-between">
          <span>Remove last marker</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Delete</kbd>
        </div>
        <div className="flex justify-between">
          <span>Download image</span>
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+S</kbd>
        </div>
      </div>
    </div>
  ), []);

  return (
    <>
      {/* Separate Settings Button - Far Left */}
      <div className="fixed top-6 left-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-10 w-10 p-0 bg-card/90 backdrop-blur-md border shadow-lg rounded-lg"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Marker settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0 border-none rounded-lg translate-y-1" align="start" side="bottom">
            <ControlPanel
              settings={markerSettings}
              onSettingsChange={onSettingsChange}
              markerCount={markerCount}
              onResetCount={onResetCount}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Center Toolbar */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 px-6 py-2 bg-card/90 backdrop-blur-md border rounded-lg shadow-lg min-w-fit">
        {/* App Title */}
        <div className="flex items-center gap-3 mr-6">
          <svg width="160" height="40" viewBox="0 0 320 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="12" width="56" height="56" rx="14" fill="#2563EB" />
            <rect x="26" y="26" width="28" height="28" rx="6" fill="#F59E0B" />
            <rect x="20" y="20" width="56" height="56" rx="14" stroke="#1E40AF" stroke-width="2" opacity="0.5"/>
            <text x="95" y="50" font-family="Inter, sans-serif" font-size="32" font-weight="600" className="fill-[#111827] dark:fill-[#FFFFFF]">
              QuickMark
            </text>
          </svg>
          <Badge variant="secondary" className="whitespace-nowrap">{markerCountText}</Badge>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Main Actions */}
        <Button onClick={onUpload} variant="ghost" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>

        <Button 
          onClick={onDownload} 
          disabled={isDownloadDisabled} 
          variant="ghost" 
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloadButtonText}
        </Button>

        <Button 
          onClick={onUndo} 
          disabled={!hasMarkers} 
          variant="ghost" 
          size="sm"
        >
          <Undo className="h-4 w-4 mr-2" />
          Undo
        </Button>

        <Button 
          onClick={onClearAll} 
          disabled={!hasMarkers} 
          variant="ghost" 
          size="sm"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>

        <Button 
          onClick={onClearCanvas} 
          disabled={!hasImage} 
          variant="ghost" 
          size="sm"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Canvas
        </Button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Keyboard Shortcuts Info */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 w-9 px-0">
              <Info className="h-4 w-4" />
              <span className="sr-only">Keyboard shortcuts</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            {keyboardShortcuts}
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <ThemeToggle />
        </div>
      </div>
    </>
  );
}

// Export memoized component with proper prop comparison
export const FloatingToolbar = memo(FloatingToolbarComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props have changed
  return (
    prevProps.markerCount === nextProps.markerCount &&
    prevProps.hasImage === nextProps.hasImage &&
    prevProps.isDownloading === nextProps.isDownloading &&
    prevProps.hasMarkers === nextProps.hasMarkers &&
    prevProps.markerSettings === nextProps.markerSettings
  );
});