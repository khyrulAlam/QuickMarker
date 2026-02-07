# QuickMark - Image Annotation Tool

A modern, feature-rich image annotation application built with React, TypeScript, Vite, and shadcn/ui. Easily upload images, place customizable markers, and download your annotated results.

## Features

### Core Functionality
- **Image Upload**: Support for JPG, PNG, and WEBP formats
- **Canvas Display**: Automatic scaling to maintain aspect ratio (max width: 900px)
- **Marker Placement**: Click to place markers on the image
- **Marker Customization**:
  - Shape: Circle or Square
  - Size: 10-50px adjustable radius
  - Fill Color: Custom color picker
  - Border Width: 1-5px adjustable
  - Border Color: Custom color picker
  - Fill Opacity: 0-100% adjustable

### Advanced Features
- **Interactive Markers**: Click on any placed marker to delete it
- **Live Preview**: Real-time preview of marker style before placement
- **Marker Counter**: Badge showing total number of markers placed
- **Hover Effects**: Markers highlight when hovering over them
- **Download**: Export annotated images as PNG with timestamp
- **Toast Notifications**: User-friendly feedback for all actions
- **Confirmation Dialogs**: AlertDialog for destructive actions

### User Experience
- **Keyboard Shortcuts**:
  - `Ctrl/Cmd + Z`: Undo last marker
  - `Delete/Backspace`: Remove last marker
  - `Ctrl/Cmd + S`: Download annotated image
- **Mobile Support**: Touch events for placing markers on mobile devices
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Accessibility**: ARIA labels and keyboard navigation support
- **Tooltips**: Helpful hints on interactive elements

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful component library
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

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
│   │   ├── ImageAnnotator.tsx    # Main annotation component
│   │   ├── ControlPanel.tsx      # Marker customization panel
│   │   ├── MarkerPreview.tsx     # Live marker preview
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── utils.ts              # Utility functions
│   ├── App.tsx                   # Main app component
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
1. Click the "Upload Image" button
2. Select an image file (JPG, PNG, or WEBP)
3. The image will be displayed on the canvas

### Placing Markers
1. Customize marker settings in the right panel:
   - Choose shape (Circle or Square)
   - Adjust size, colors, and opacity
   - See live preview of your marker style
2. Click anywhere on the image to place a marker
3. On mobile, tap on the image to place markers

### Editing Markers
- **Delete Individual Marker**: Click directly on any marker
- **Undo Last Marker**: Click "Undo Last" button or press `Ctrl/Cmd + Z`
- **Clear All Markers**: Click "Clear All Markers" and confirm

### Downloading
1. Click the "Download Image" button or press `Ctrl/Cmd + S`
2. The annotated image will be saved as `annotated-image-[timestamp].png`

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
}
```

## Canvas Coordinate System

The application uses HTML5 Canvas with the following coordinate system:
- Origin (0, 0) is at the top-left corner
- X-axis increases from left to right
- Y-axis increases from top to bottom
- Mouse and touch events are converted to canvas coordinates using `getBoundingClientRect()`
- Canvas scaling is handled to maintain image aspect ratio

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

Made with ❤️ by QuickMark Team
