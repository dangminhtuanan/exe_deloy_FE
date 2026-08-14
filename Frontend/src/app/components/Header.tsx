import { LogOut, Search, ShoppingBag, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  cartCount: number;
}

const navItems = [
  { label: "TRANG CHỦ", href: "/" },
  { label: "THỬ ĐỒ AI", href: "/use-ai" },
  { label: "GÓI AI", href: "/ai-packages" },
];

export function Header({ cartCount }: HeaderProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const accountPath = !isAuthenticated
    ? "/login"
    : user?.role === "admin"
      ? "/admin"
      : user?.role === "shipper"
        ? "/shipper"
        : "/profile";

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[64px] w-full max-w-[1600px] items-center gap-2 px-3 sm:h-[72px] sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 flex-1 items-center sm:w-44 sm:flex-none">
          <Link to="/" className="inline-flex flex-col leading-none">
            <span className="text-xl font-black tracking-[-0.06em] text-slate-950 sm:text-2xl">
              OUTFIO
            </span>
            <span className="mt-1 text-[8px] uppercase tracking-[0.3em] text-slate-400">
              Fashion Store
            </span>
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`relative py-7 text-[10px] font-bold uppercase transition-colors hover:text-[#3977ed] ${
                  isActive
                    ? "text-[#3977ed] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#3977ed]"
                    : "text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end sm:w-44 sm:gap-1">
          <Button variant="ghost" size="icon" className="hidden h-9 w-9 text-slate-600 hover:text-[#3977ed] min-[360px]:inline-flex" aria-label="Tìm kiếm">
            <Search className="h-4 w-4" />
          </Button>
          <Link to={accountPath}>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-600 hover:text-[#3977ed]"
            >
              <User className="h-4 w-4" />
            </Button>
          </Link>

          {isAuthenticated && (
            <Button
              variant="ghost"
              className="hidden h-9 px-2 text-slate-600 hover:text-[#3977ed] sm:inline-flex"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Đăng xuất</span>
            </Button>
          )}

          <Link to="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 text-slate-600 hover:text-[#3977ed]"
            >
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3977ed] px-1 text-[10px] font-semibold leading-none text-white">
                  {cartCount}
                </span>
              )}
            </Button>
          </Link>

          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-[#8b5d7c] hover:text-pink-500 sm:hidden"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 md:hidden">
        <nav className="mx-auto flex max-w-[1600px] gap-5 overflow-x-auto px-4 py-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`shrink-0 text-[11px] font-semibold uppercase ${
                pathname === item.href ? "text-[#3977ed]" : "text-slate-600"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
