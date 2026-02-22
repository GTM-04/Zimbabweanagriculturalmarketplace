import { RouterProvider } from 'react-router';
import { AuthDebug } from './components/AuthDebug';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  const isDevelopment = import.meta.env.DEV;
  
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
      {isDevelopment && <AuthDebug />}
    </>
  );
}
