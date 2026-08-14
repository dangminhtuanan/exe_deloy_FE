import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartSheet } from './CartSheet';
import { ChatBot } from './ChatBot';
import { useCart } from '../contexts/CartContext';

export function Layout() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items, totalItems, updateQuantity, removeItem } = useCart();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <Header cartCount={totalItems} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartSheet 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
      />
      <ChatBot />
    </div>
  );
}
