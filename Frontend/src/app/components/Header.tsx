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
    <header className="sticky top-0 z-50 shrink-0 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-2 px-3 sm:h-[84px] sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 flex-1 items-center sm:w-44 sm:flex-none">
          <Link to="/" className="inline-flex flex-col leading-none">
            <span className="text-2xl font-black tracking-[-0.06em] text-slate-950 sm:text-[30px]">
              OUTFIO
            </span>
            <span className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Fashion Store
            </span>
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-10 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.label}
                to={item.href}
                className={`relative flex h-11 items-center rounded-lg border px-4 text-xs font-extrabold uppercase tracking-wide transition-all ${
                  isActive
                    ? "border-[#3977ed] bg-[#3977ed] text-white shadow-sm"
                    : "border-transparent text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563eb]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end sm:w-44 sm:gap-1">
          <Button variant="ghost" size="icon" className="hidden h-11 w-11 text-slate-700 hover:text-[#3977ed] min-[360px]:inline-flex" aria-label="Tìm kiếm">
            <Search className="h-5 w-5" />
          </Button>
          <Link to={accountPath}>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-slate-700 hover:text-[#3977ed]"
            >
              <User className="h-5 w-5" />
            </Button>
          </Link>

          {isAuthenticated && (
            <Button
              variant="ghost"
              className="hidden h-11 px-3 text-sm font-semibold text-slate-700 hover:text-[#3977ed] sm:inline-flex"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline">Đăng xuất</span>
            </Button>
          )}

          <Link to="/cart">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 text-slate-700 hover:text-[#3977ed]"
            >
              <ShoppingBag className="h-5 w-5" />
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
              className="h-11 w-11 text-[#8b5d7c] hover:text-pink-500 sm:hidden"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 md:hidden">
        <nav className="mx-auto flex max-w-[1600px] gap-7 overflow-x-auto px-4 py-3.5">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-colors ${
                pathname === item.href
                  ? "border-[#3977ed] bg-[#3977ed] text-white shadow-sm"
                  : "border-transparent text-slate-700 hover:bg-blue-50 hover:text-[#3977ed]"
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
