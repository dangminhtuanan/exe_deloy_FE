import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../lib/api";
import type { UserRole } from "../types";

function getRoleDashboardPath(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  if (role === "shipper") return "/shipper";
  return null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const redirectTo =
    typeof location.state === "object" && location.state !== null &&
    "from" in location.state && typeof location.state.from === "string"
      ? location.state.from
      : null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const session = await login({ email: email.trim(), password });
      toast.success("Đăng nhập thành công");
      const dashboardPath = getRoleDashboardPath(session.profile.role);
      if (dashboardPath) return void navigate(dashboardPath, { replace: true });
      if (redirectTo && redirectTo !== "/login") return void navigate(redirectTo, { replace: true });
      navigate("/", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Chào mừng bạn trở lại"
      description="Đăng nhập để tiếp tục khám phá những lựa chọn thời trang và trải nghiệm mua sắm dành riêng cho bạn."
    >
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">Đăng nhập</h1>
        <p className="mt-2 text-sm text-slate-500">
          Chưa có tài khoản? <Link to="/signup" className="font-semibold text-[#3977ed] hover:underline">Đăng ký ngay</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="example@email.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mật khẩu</Label>
            <Link to="/forgot-password" className="text-sm text-slate-500 transition-colors hover:text-[#3977ed]">Quên mật khẩu?</Link>
          </div>
          <div className="relative">
            <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(event) => setPassword(event.target.value)} className="pr-11" required />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-[#3977ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3977ed]" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={showPassword}>
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <Button type="submit" className="w-full bg-[#3977ed] text-white shadow-sm hover:bg-[#2868db]" size="lg" disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs leading-5 text-slate-400">
        Bằng việc đăng nhập, bạn đồng ý với <Link to="/terms" className="hover:text-[#3977ed] hover:underline">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="hover:text-[#3977ed] hover:underline">Chính sách bảo mật</Link>
      </p>
    </AuthLayout>
  );
}
