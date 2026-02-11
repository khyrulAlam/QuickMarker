# QuickMark - Image Annotation Tool

A modern, feature-rich image annotation application built with React, TypeScript, Vite, and shadcn/ui. Easily upload images, place customizable markers with text or sequential numbering, and download high-quality annotated results. Features session persistence, user settings management, dark/light theme support, and optimized performance with hash-based dirty detection.

## Features

### Core Functionality
- **Image Upload**: Support for JPG, PNG, and WEBP formats with drag & drop
- **Canvas Display**: Automatic scaling to maintain aspect ratio (max width: 900px)
- **Marker Placement**: Click or touch to place markers on the image
- **Marker Customization**:
  - Shape: Circle or Square
  - Size: 10-50px adjustable radius
  - Fill Color: Custom color picker
  - Border Width: 1-5px adjustable
  - Border Color: Custom color picker
  - Fill Opacity: 0-100% adjustable

### Text & Numbering Features
- **Optional Text in Markers**: Add custom text inside markers
  - Text color customization
  - Font size adjustment (8-24px)
  - Text stroke for better readability
- **Sequential Count Numbers**: Automatic numbering (1, 2, 3...)
  - Count color customization
  - Count font size adjustment (8-24px)
  - Reset count functionality
  - Order based on marker placement sequence
- **Mutually Exclusive**: Text OR count mode (not both simultaneously)

### Advanced Features
- **Interactive Markers**: Click on any placed marker to delete it
- **Live Preview**: Real-time preview of marker style before placement
- **Marker Counter**: Badge showing total number of markers placed
- **Hover Effects**: Markers highlight when hovering over them
- **High-Quality Downloads**: Export at original image resolution (not canvas size)
- **Collapsible UI**: Organized control panel with expandable sections
- **Toast Notifications**: User-friendly feedback for all actions
- **Confirmation Dialogs**: AlertDialog for destructive actions
- **Session Persistence**: Automatically saves your work using IndexedDB
  - Image and markers persist across browser sessions
  - Restore previous work on page reload
  - Clear session functionality available
- **User Settings Management**: Saves marker preferences
  - Settings persist across sessions
  - Automatically loaded on startup
- **Theme Support**: Dark and light mode toggle
  - System theme detection
  - Persistent theme preference
- **Floating Toolbar**: Quick access to common actions
  - Clear markers, clear canvas, reset count
  - Minimizable control panel
- **Performance Optimized**: Hash-based dirty detection
  - 40-80% faster canvas redraws
  - Handles 100+ markers smoothly
  - Automatic property change detection

### User Experience
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Z`: Undo last marker
  - `Delete/Backspace`: Remove last marker
  - `Ctrl/Cmd + S`: Download annotated image
  - `Ctrl/Cmd + K`: Clear all markers
- **Mobile Support**: Touch events for placing markers on mobile devices
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: ARIA labels and keyboard navigation support
- **Tooltips**: Helpful hints on interactive elements
- **Auto-Save**: Work is automatically saved to IndexedDB
- **Session Recovery**: Resume where you left off after browser close
- **Debounced Settings**: Smooth settings updates without performance impact

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **IndexedDB** - Client-side storage for session persistence
- **Dexie.js** - IndexedDB wrapper for data management
- **next-themes** - Theme management system

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
cd QuickMark
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
QuickMark/
├── src/
│   ├── components/
│   │   ├── ImageAnnotator.tsx    # Main annotation component (360+ lines)
│   │   ├── ControlPanel.tsx      # Collapsible settings panel (400+ lines)
│   │   ├── FloatingToolbar.tsx   # Quick action toolbar (190+ lines)
│   │   ├── MarkerPreview.tsx     # Live marker preview
│   │   ├── ThemeToggle.tsx       # Dark/light theme switcher
│   │   └── ui/                   # shadcn/ui components
│   ├── hooks/
│   │   ├── useCanvas.ts          # Canvas rendering with hash-based dirty detection
│   │   ├── useImageUpload.ts     # Image upload logic
│   │   ├── useMarkers.ts         # Marker state management
│   │   ├── useKeyboardShortcuts.ts # Keyboard shortcuts handler
│   │   ├── useSessionPersistence.ts # Session save/restore
│   │   └── usePersistedSettings.ts # User settings persistence
│   ├── services/
│   │   ├── sessionService.ts     # Session data operations
│   │   └── settingsService.ts    # Settings data operations
│   ├── db/
│   │   ├── schema.ts             # IndexedDB schema
│   │   └── repositories/         # Data access layer
│   ├── utils/
│   │   ├── canvasUtils.ts        # Canvas drawing utilities with hash function
│   │   ├── imageUtils.ts         # Image processing utilities
│   │   ├── downloadUtils.ts      # Download functionality
│   │   └── spatialIndex.ts       # Marker hit detection optimization
│   ├── lib/
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── utils.ts              # Utility functions
│   ├── App.tsx                   # Main app component with theme provider
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles
├── public/                       # Static assets
├── index.html                    # HTML template
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project dependencies
```

## Usage Guide

### Uploading an Image
1. Click the "Upload Image" button or drag & drop an image
2. Select an image file (JPG, PNG, or WEBP)
3. The image will be displayed on the canvas

### Placing Markers
1. Customize marker settings in the collapsible right panel:
   - **🎨 Shape & Style**: Choose shape, size, colors, and opacity
   - **📝 Text Options**: Add optional text with color and font size
   - **🔢 Count Options**: Enable sequential numbering with customization
   - See live preview of your marker style
2. Click anywhere on the image to place a marker
3. On mobile, tap on the image to place markers

### Text vs Count Modes
- **Text Mode**: Add custom text inside markers (optional)
- **Count Mode**: Sequential numbers (1, 2, 3...) based on placement order
- **Mutually Exclusive**: Only one mode can be active at a time
- **Reset Count**: Use reset button to restart numbering from 1

### Editing Markers
- **Delete Individual Marker**: Click directly on any marker
- **Undo Last Marker**: Click "Undo Last" button or press `Ctrl/Cmd + Z`
- **Clear All Markers**: Click "Clear Markers" in toolbar or press `Ctrl/Cmd + K`
- **Clear Canvas**: Click "Clear Canvas" to remove image and all markers
- **Reset Count**: Click "Reset Count" to restart numbering from 1

### Downloading
1. Click the "Download Image" button or press `Ctrl/Cmd + S`
2. High-quality image (original resolution) will be saved as `annotated-image-[timestamp].png`

### Session Management
- **Auto-Save**: Your work is automatically saved to IndexedDB as you make changes
- **Session Recovery**: When you reload the page, your previous image and markers are restored
- **Clear Session**: Use the "Clear Canvas" button to start fresh
- **Settings Persistence**: Marker preferences are saved and restored across sessions

### Performance Features
The application includes several performance optimizations:
- **Hash-Based Dirty Detection**: Canvas only redraws when visual properties actually change
  - 40-80% faster than property-by-property comparison
  - Automatically detects changes to position, size, color, opacity, borders, text, and count
- **Debounced Settings**: Settings updates are debounced to prevent excessive re-renders
- **Memoized Components**: Control panel and toolbar are memoized to prevent unnecessary re-renders
- **Transaction Batching**: IndexedDB operations are batched for better performance
- **Spatial Indexing**: Fast marker hit detection for large numbers of markers
- **RequestAnimationFrame**: Smooth 60fps canvas updates

## TypeScript Interfaces

### Marker
```typescript
interface Marker {
  id: string;
  x: number;
  y: number;
  shape: 'circle' | 'square';
  size: number;
  color: string;
  borderSize: number;
  borderColor: string;
  opacity: number;
  // Text options
  text?: string;
  textColor?: string;
  fontSize?: number;
  showText?: boolean;
  // Count options
  count?: number;
  showCount?: boolean;
  countColor?: string;
  countFontSize?: number;
}
```

### MarkerSettings
```typescript
interface MarkerSettings {
  shape: 'circle' | 'square';
  size: number;
  color: string;
  borderSize: number;
  borderColor: string;
  opacity: number;
  // Text settings
  text: string;
  textColor: string;
  fontSize: number;
  showText: boolean;
  // Count settings
  showCount: boolean;
  countColor: string;
  countFontSize: number;
}
```

## Architecture

### Custom Hooks Pattern
The application follows a modular architecture with custom React hooks:

- **useCanvas**: Manages canvas rendering with optimized dirty detection
- **useImageUpload**: Handles image upload and file processing
- **useMarkers**: Manages marker state and operations
- **useKeyboardShortcuts**: Centralized keyboard shortcut handling
- **useSessionPersistence**: Auto-save/restore session data
- **usePersistedSettings**: User settings persistence

### Data Layer
- **IndexedDB**: Client-side database for offline storage
- **Dexie.js**: Type-safe IndexedDB wrapper
- **Repository Pattern**: Separate repositories for sessions and settings
- **Service Layer**: Business logic abstraction

### Canvas Coordinate System
The application uses HTML5 Canvas with the following coordinate system:
- Origin (0, 0) is at the top-left corner
- X-axis increases from left to right
- Y-axis increases from top to bottom
- Mouse and touch events are converted to canvas coordinates using `getBoundingClientRect()`
- Canvas scaling is handled to maintain image aspect ratio

### Performance Optimizations

**Hash-Based Dirty Detection**:
```typescript
// Creates a fast fingerprint of all visual properties
export const getMarkerVisualHash = (marker: Marker): string => {
  return `${marker.x}:${marker.y}:${marker.size}:${marker.color}:${marker.opacity}:` +
         `${marker.borderSize}:${marker.borderColor}:${marker.shape}:` +
         `${marker.count ?? ''}:${marker.countColor ?? ''}:${marker.countFontSize ?? ''}:...`;
};

// Only redraws when hash changes
const needsFullRedraw = markers.some((marker) => {
  const prevHash = prevMarkerHashesRef.current.get(marker.id);
  const currentHash = getMarkerVisualHash(marker);
  return prevHash !== currentHash;
});
```

**Benefits**:
- Single comparison per marker instead of 17 property checks
- Automatically catches ALL visual property changes
- Future-proof for new marker properties
- 40-80% faster than naive approach

## Customization

### Changing Default Marker Settings
Edit the initial state in `src/components/ImageAnnotator.tsx`:

```typescript
const [markerSettings, setMarkerSettings] = useState<MarkerSettings>({
  shape: 'circle',
  size: 20,
  color: '#ff0000',
  borderSize: 2,
  borderColor: '#000000',
  opacity: 50,
  // Text defaults
  text: '',
  textColor: '#ffffff',
  fontSize: 12,
  showText: false,
  // Count defaults
  showCount: false,
  countColor: '#ffffff',
  countFontSize: 14,
});
```

### Adjusting Canvas Size
Modify the `MAX_CANVAS_WIDTH` constant in `src/components/ImageAnnotator.tsx`:

```typescript
const MAX_CANVAS_WIDTH = 900; // Change to your desired width
```

### Theme Customization
Edit `tailwind.config.js` and `src/index.css` to customize colors and theme.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with [React](https://react.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

Made with ❤️ by [Khayrul Alam](https://khayrulalam.com)
