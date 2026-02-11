import { Download, Upload, Undo, Trash2, Info, Settings } from 'lucide-react';
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
  markerCount: number;
  hasImage: boolean;
  isDownloading: boolean;
  hasMarkers: boolean;
  markerSettings: MarkerSettings;
  onSettingsChange: (settings: MarkerSettings) => void;
  onResetCount: () => void;
}

export function FloatingToolbar({
  onUpload,
  onDownload,
  onUndo,
  onClearAll,
  markerCount,
  hasImage,
  isDownloading,
  hasMarkers,
  markerSettings,
  onSettingsChange,
  onResetCount,
}: FloatingToolbarProps) {
  return (
    <>
      {/* Separate Settings Button - Far Left */}
      <div className="fixed top-4 left-4 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-12 w-12 p-0 bg-card/90 backdrop-blur-md border shadow-lg rounded-lg"
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">Marker settings</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" side="bottom">
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
          <h1 className="text-lg font-semibold whitespace-nowrap">QuickMark</h1>
          <Badge variant="secondary" className="whitespace-nowrap">{markerCount} markers</Badge>
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
          disabled={!hasImage || isDownloading} 
          variant="ghost" 
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Downloading...' : 'Download'}
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
          </PopoverContent>
        </Popover>

        {/* Theme Toggle */}
        <ThemeToggle />
        </div>
      </div>
    </>
  );
}