import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <div className="app-bubble-surface min-h-screen">
      <AuthProvider>
        <CartProvider>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" richColors closeButton />
        </CartProvider>
      </AuthProvider>
    </div>
  );
}
