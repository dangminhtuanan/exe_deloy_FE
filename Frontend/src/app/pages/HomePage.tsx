import { useEffect, useState } from "react";
import { Hero } from "../components/Hero";
import { ProductCard } from "../components/ProductCard";
import type { Category, Pagination, Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";
import { categoriesApi, getErrorMessage, productsApi } from "../lib/api";

export function HomePage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategories(response.categories);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await productsApi.getAll({
          category: selectedCategory || undefined,
          page,
          limit: 18,
          sort: "newest",
          inStock: true,
        });

        if (!cancelled) {
          setProducts(response.products);
          setPagination(response.pagination ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setProducts([]);
          setPagination(null);
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingProducts(false);
        }
      }
    };

    void loadProducts();

    return () => {
      cancelled = true;
    };
  }, [page, selectedCategory]);

  const selectCategory = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product, 1);
      toast.success("Đã thêm vào giỏ hàng");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <>
      <Hero imageUrl="https://images.unsplash.com/photo-1762430815620-fcca603c240c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwbW9kZWwlMjBydW53YXl8ZW58MXx8fHwxNzczMDY2MzQ4fDA&ixlib=rb-4.1.0&q=80&w=1080" />

      <section className="relative z-10 -mt-12 px-4">
        <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(72,106,160,.12)] backdrop-blur md:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 md:justify-center scrollbar-hide">
            <button
              onClick={() => selectCategory("")}
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-xs font-semibold transition-colors ${
                selectedCategory === ""
                  ? "border-[#3977ed] bg-[#3977ed] text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#3977ed] hover:text-[#3977ed]"
              }`}
            >
              Tất cả
            </button>
            {categories.map((category) => {
              const value = category.slug || category._id;
              return (
                <button
                  key={category._id}
                  onClick={() => selectCategory(value)}
                  className={`whitespace-nowrap rounded-full border px-5 py-2 text-xs font-semibold transition-colors ${
                    selectedCategory === value
                      ? "border-[#3977ed] bg-[#3977ed] text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#3977ed] hover:text-[#3977ed]"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-14 pt-9 md:pt-11">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">Sản phẩm nổi bật</h2>
          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-3">
                  <div className="aspect-[3/4] rounded-md bg-gray-100 animate-pulse" />
                  <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
              Chưa có sản phẩm phù hợp.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 md:gap-x-5 lg:grid-cols-5 2xl:grid-cols-6">
              {products.map((product) => (
                <ProductCard
                  key={product.productId || product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
          {!loadingProducts && pagination && pagination.totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
              <p className="text-sm text-gray-500">
                Trang {pagination.page} / {pagination.totalPages} · Tổng {pagination.total} sản phẩm
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                  disabled={page >= pagination.totalPages}
                  className="rounded border px-4 py-2 text-sm font-medium transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tiếp
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-[#f7faff] py-16">
        <div className="container mx-auto px-4 text-center max-w-xl">
          <h2 className="text-2xl font-bold mb-4">Đăng ký nhận tin</h2>
          <p className="text-gray-600 mb-6">
            Nhận thông tin về sản phẩm mới và ưu đãi đặc biệt
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 px-4 py-3 rounded border focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800 transition-colors">
              Đăng ký
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
