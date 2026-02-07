# SETUP PROMPT: Project Initialization

Help me set up a new React project with Vite and shadcn/ui for an image annotation application:

1. Create a new Vite project with React and TypeScript
2. Install and configure Tailwind CSS
3. Install and configure shadcn/ui
4. Set up the basic project structure with:
   - src/components folder
   - src/lib folder for utilities
   - App.tsx as the main component

Provide step-by-step terminal commands and configuration instructions.

After setup, install these shadcn/ui components:
- Button
- Slider
- Select
- Label
- Card
- Input
- Separator

Please provide all necessary commands and configuration files.


# PHASE 1 PROMPT: Image Upload & Canvas Display

Create an ImageAnnotator component for a React + Vite application using shadcn/ui:

1. Create a Card component as the main container
2. Add a file input using shadcn/ui Input component for image upload (jpg, png, webp)
3. Display the uploaded image on an HTML5 canvas element
4. Automatically scale the image to fit the canvas while maintaining aspect ratio
5. Use a maximum canvas width of 900px and adjust height proportionally
6. Center the image on the canvas

UI Requirements:
- Use shadcn/ui Card, CardHeader, CardTitle, CardContent components
- Use shadcn/ui Button for file selection
- Show a placeholder message when no image is loaded
- Modern, clean design consistent with shadcn/ui style

Technical requirements:
- Use TypeScript
- Use React hooks (useState, useRef, useEffect)
- Handle FileReader API to load the image
- Clear previous image when a new one is uploaded
- Type all props and state properly


# PHASE 2 PROMPT: Marker Placement

Extend the ImageAnnotator component to add marker placement functionality:

1. Allow users to click on the canvas to place circular markers
2. Each marker should have default properties:
   - Size: 20px radius
   - Color: red with 50% opacity fill
   - Border: 2px solid black
3. Store all markers in state with TypeScript interface
4. Redraw canvas whenever markers change (image + all markers)
5. Add a "Clear All Markers" button using shadcn/ui Button (variant="destructive")
6. Add a "Undo Last" button using shadcn/ui Button (variant="outline")

Technical requirements:
- Create a Marker interface/type for TypeScript
- Handle canvas click events and convert to canvas coordinates
- Account for canvas scaling when placing markers
- Efficient redrawing mechanism
- Use useCallback where appropriate

Please maintain the shadcn/ui design system throughout.

# PHASE 3 PROMPT: Marker Customization Panel
Add a marker customization control panel to the ImageAnnotator component using shadcn/ui:

1. Create a sidebar or panel with the following controls (use shadcn/ui components):
   - Marker shape: Select component with "Circle" and "Square" options
   - Marker size: Slider component (10-50px range, default 20)
   - Marker color: Input type="color" with Label
   - Border size: Slider component (1-5px range, default 2)
   - Border color: Input type="color" with Label
   - Fill opacity: Slider component (0-100%, default 50)

2. Show a live preview of the current marker style in a small canvas
3. Display marker count using a Badge component
4. Use Separator components to organize sections

UI Requirements:
- Use shadcn/ui Card for the control panel
- Use Label components for all inputs
- Use Slider components with value display
- Organize with proper spacing and sections
- Responsive layout (sidebar on desktop, collapsible on mobile)

Technical requirements:
- Create MarkerSettings interface for TypeScript
- Use controlled inputs for all settings
- Update preview in real-time
- Each placed marker stores its own style properties


# PHASE 4 PROMPT: Download Functionality

Add download functionality to the ImageAnnotator component:

1. Add a "Download Image" button using shadcn/ui Button (variant="default")
   - Use Download icon from lucide-react
2. Download the canvas as PNG with filename: "annotated-image-[timestamp].png"
3. Use canvas.toBlob() method for efficient download
4. Add a toast notification on successful download using shadcn/ui Toast

Technical requirements:
- Install and configure shadcn/ui Toast/Sonner component
- Create download utility function
- Handle blob creation and cleanup
- Show loading state on button during download
- Proper error handling with toast notifications

Please ensure TypeScript types are correct for all download-related functions.


# PHASE 5 PROMPT: Polish & Enhancements
Polish the ImageAnnotator component with these enhancements using shadcn/ui:

1. Add ability to delete individual markers:
   - Hover over markers to highlight them
   - Click on marker to delete it
   - Show tooltip on hover using shadcn/ui Tooltip

2. Add keyboard shortcuts:
   - Ctrl/Cmd + Z for undo
   - Delete/Backspace for removing last marker
   - Ctrl/Cmd + S for download

3. Add these shadcn/ui components:
   - AlertDialog for confirming "Clear All"
   - Progress indicator when loading large images
   - Tabs for organizing controls if needed

4. Improve mobile experience:
   - Sheet component for mobile controls drawer
   - Touch event support for marker placement
   - Responsive canvas sizing

5. Add zoom controls:
   - Zoom in/out buttons
   - Reset zoom button
   - Display current zoom level

Technical requirements:
- Use shadcn/ui Dialog, AlertDialog, Sheet, Tooltip components
- Implement keyboard event listeners with cleanup
- Add touch event handlers
- Proper TypeScript typing for all new features
- Accessibility improvements (ARIA labels, keyboard navigation)

Ensure the entire app follows shadcn/ui design patterns and best practices.


# COMPLETE SINGLE PROMPT (All-in-One Approach)
Create a complete image annotation application using React + Vite + TypeScript + shadcn/ui:

**Tech Stack:**
- React 18+ with TypeScript
- Vite as build tool
- shadcn/ui for UI components
- Tailwind CSS for styling
- lucide-react for icons

**Required shadcn/ui Components:**
Button, Card, Input, Label, Slider, Select, Separator, Badge, Toast/Sonner, Tooltip, AlertDialog

**Features:**

1. **Image Upload:**
   - File input with shadcn/ui Button and Input
   - Display on HTML5 canvas with proper scaling
   - Max canvas width: 900px with aspect ratio maintained

2. **Marker Placement:**
   - Click on canvas to place markers
   - Store markers with coordinates and style properties
   - Visual feedback on placement

3. **Marker Customization Panel (shadcn/ui components):**
   - Shape: Select (Circle/Square)
   - Size: Slider (10-50px)
   - Color: Color Input with Label
   - Border width: Slider (1-5px)
   - Border color: Color Input
   - Fill opacity: Slider (0-100%)
   - Live preview of current marker style

4. **Controls:**
   - "Clear All Markers" button (with AlertDialog confirmation)
   - "Undo Last" button
   - "Download Image" button (with toast notification)
   - Marker counter using Badge

5. **Download:**
   - Canvas to PNG download
   - Filename: annotated-image-[timestamp].png
   - Use canvas.toBlob() method

**UI/UX Requirements:**
- Modern, clean design following shadcn/ui patterns
- Responsive layout (sidebar on desktop, drawer/sheet on mobile)
- Loading states and error handling
- Proper TypeScript typing throughout
- Organized code structure with separate components

**File Structure:**

src/
├── components/
│   ├── ImageAnnotator.tsx
│   ├── ControlPanel.tsx
│   ├── MarkerPreview.tsx
│   └── ui/ (shadcn/ui components)
├── lib/
│   ├── utils.ts
│   └── types.ts
├── App.tsx
└── main.tsx

Please create this as a well-structured, production-ready application with proper TypeScript types, comments, and following React best practices.


"Show me the package.json dependencies I need"
"Explain how the canvas coordinate system works in this code"
"Add proper TypeScript interfaces for all the state"
"Make this component more accessible"
"Split this into smaller reusable components"
"Add error boundaries for better error handling"