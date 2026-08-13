import { ShoppingBag } from 'lucide-react';
import { Button } from './ui/button';
import { Product } from '../types';
import { Link } from 'react-router';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void | Promise<void>;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className="group relative min-w-0">
      <Link to={`/product/${product.id}`} className="relative mb-3 block aspect-[4/5] overflow-hidden rounded-xl bg-[#f5f6f8]">
        <img
          src={product.image || "/favicon.svg"}
          alt={product.name}
          className="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
        {product.discount && (
          <div className="absolute left-2 top-2 z-10 rounded-md bg-rose-500 px-2 py-1 text-[10px] font-bold text-white shadow-sm">
            -{product.discount}%
          </div>
        )}
      </Link>

      <div className="space-y-1 px-0.5">
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="line-clamp-2 text-[13px] font-semibold text-slate-900 transition-colors hover:text-[#3977ed]">{product.name}</h3>
        </Link>
        <p className="text-[11px] text-slate-400">{product.category}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-sm font-bold text-slate-900">
              {product.price.toLocaleString('vi-VN')} VND
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString('vi-VN')} VND
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void onAddToCart(product)}
            className="h-7 w-7 shrink-0 p-0"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
