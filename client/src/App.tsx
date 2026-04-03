import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { Button } from './components/ui/button';

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div>
        <Button></Button>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </ThemeProvider>
  );
};

export default App;
