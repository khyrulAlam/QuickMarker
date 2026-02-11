import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onUndo: () => void;
  onDownload: () => void;
  hasMarkers: boolean;
  hasImage: boolean;
}

export const useKeyboardShortcuts = ({
  onUndo,
  onDownload,
  hasMarkers,
  hasImage,
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo last marker (Ctrl/Cmd + Z or Delete/Backspace)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z') ||
        event.key === 'Delete' ||
        event.key === 'Backspace'
      ) {
        event.preventDefault();
        if (hasMarkers) {
          onUndo();
        }
      }

      // Download image (Ctrl/Cmd + S)
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasImage) {
          onDownload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onUndo, onDownload, hasMarkers, hasImage]);
};