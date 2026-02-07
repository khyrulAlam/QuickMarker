import { Toaster } from 'sonner';
import ImageAnnotator from './components/ImageAnnotator';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" richColors />
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            QuickMark
          </h1>
          <p className="text-muted-foreground mt-1">
            Image Annotation Tool - Upload, annotate, and download images with custom markers
          </p>
        </div>
        <ImageAnnotator />
      </div>
    </div>
  );
}

export default App;
