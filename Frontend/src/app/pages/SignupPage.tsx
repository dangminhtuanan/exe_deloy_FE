import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { authApi, getErrorMessage } from "../lib/api";

type SignupStep = "register" | "verify";

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SignupStep>("register");
  const [formData, setFormData] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((current) => ({ ...current, [event.target.id]: event.target.value }));
  };

  const sendOtp = () => authApi.registerSendOtp({
    username: formData.username.trim(),
    email: formData.email.trim(),
    password: formData.password,
  });

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản dịch vụ");
      return;
    }
    setLoading(true);
    try {
      await sendOtp();
      toast.success("OTP đã được gửi về email của bạn");
      setStep("verify");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await authApi.registerVerifyOtp({ email: formData.email.trim(), otp: otp.trim() });
      toast.success("Đăng ký thành công, hãy đăng nhập");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await sendOtp();
      toast.success("Đã gửi lại OTP");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const passwordButton = (visible: boolean, toggle: () => void, label: string) => (
    <button type="button" onClick={toggle} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition-colors hover:text-[#3977ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#3977ed]" aria-label={label} aria-pressed={visible}>
      {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
    </button>
  );

  return (
    <AuthLayout
      title="Mặc đẹp theo cách của bạn"
      description="Tạo tài khoản để lưu lựa chọn yêu thích, mua sắm nhanh hơn và trải nghiệm các tính năng thời trang AI."
    >
      <div className="mb-7">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">{step === "register" ? "Tạo tài khoản" : "Xác thực OTP"}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Đã có tài khoản? <Link to="/login" className="font-semibold text-[#3977ed] hover:underline">Đăng nhập</Link>
        </p>
      </div>

      {step === "register" ? (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Tên đăng nhập</Label>
            <Input id="username" type="text" placeholder="Nhập tên đăng nhập" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="example@email.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={handleChange} className="pr-11" required minLength={6} />
                {passwordButton(showPassword, () => setShowPassword((value) => !value), showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} className="pr-11" required />
                {passwordButton(showConfirmPassword, () => setShowConfirmPassword((value) => !value), showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu")}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(checked) => setAgreeTerms(Boolean(checked))} />
            <label htmlFor="terms" className="text-xs leading-5 text-slate-500">
              Tôi đồng ý với <Link to="/terms" className="font-medium text-slate-800 hover:text-[#3977ed] hover:underline">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="font-medium text-slate-800 hover:text-[#3977ed] hover:underline">Chính sách bảo mật</Link>
            </label>
          </div>
          <Button type="submit" className="w-full bg-[#3977ed] text-white shadow-sm hover:bg-[#2868db]" size="lg" disabled={loading}>
            {loading ? "Đang gửi OTP..." : "Tạo tài khoản"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} className="space-y-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-6 text-slate-600">
            OTP đã được gửi tới <strong className="text-slate-900">{formData.email}</strong>. Mã có hiệu lực trong 10 phút.
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">Mã OTP</Label>
            <Input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="Nhập 6 số OTP" value={otp} onChange={(event) => setOtp(event.target.value)} className="text-center text-lg tracking-[0.35em]" required />
          </div>
          <Button type="submit" className="w-full bg-[#3977ed] text-white shadow-sm hover:bg-[#2868db]" size="lg" disabled={loading}>
            {loading ? "Đang xác thực..." : "Xác thực và tạo tài khoản"}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" onClick={() => setStep("register")} disabled={loading}>Quay lại</Button>
            <Button type="button" variant="outline" onClick={handleResendOtp} disabled={loading}>Gửi lại OTP</Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
