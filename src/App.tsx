import { Toaster } from 'sonner';
import { ThemeProvider } from '@/hooks/useTheme';
import ImageAnnotator from './components/ImageAnnotator';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="quickmark-theme">
      <div className="h-screen w-screen bg-background overflow-hidden">
        <Toaster position="top-right" richColors />
        <ImageAnnotator />
      </div>
    </ThemeProvider>
  );
}

export default App;
