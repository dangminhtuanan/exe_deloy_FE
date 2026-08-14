import { Link } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/ui/button";

export function TermsPage() {
  return (
    <AuthLayout
      title="Điều khoản dịch vụ"
      description="Cảm ơn bạn đã lựa chọn Outfio. Vui lòng đọc kỹ các điều khoản dưới đây trước khi trải nghiệm dịch vụ."
    >
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
          Điều khoản dịch vụ
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cập nhật lần cuối: Tháng 8/2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-600 leading-relaxed max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc tạo tài khoản hoặc truy cập vào nền tảng Outfio, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản, điều kiện này. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Tài khoản người dùng</h2>
          <p>
            Bạn có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Outfio không chịu trách nhiệm cho bất kỳ tổn thất nào phát sinh do việc bạn không bảo vệ thông tin cá nhân.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Mua hàng và Thanh toán</h2>
          <p>
            Các đơn hàng đặt trên Outfio phải đảm bảo tính xác thực của thông tin giao hàng. Chúng tôi có quyền hủy đơn hàng nếu phát hiện dấu hiệu gian lận hoặc vi phạm chính sách thanh toán.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ nội dung, hình ảnh sản phẩm, thiết kế giao diện và thương hiệu trên website đều thuộc quyền sở hữu độc quyền của Outfio.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Liên hệ</h2>
          <p>
            Nếu có bất kỳ câu hỏi nào về Điều khoản dịch vụ, vui lòng liên hệ với bộ phận hỗ trợ của chúng tôi qua email:{" "}
            <a href="mailto:project.outfio@gmail.com" className="font-semibold text-[#3977ed] hover:underline">
              project.outfio@gmail.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link to="/login">
          <Button variant="outline" size="sm">
            Quay lại Đăng nhập
          </Button>
        </Link>
        <Link to="/privacy" className="text-xs font-semibold text-[#3977ed] hover:underline">
          Xem Chính sách bảo mật &rarr;
        </Link>
      </div>
    </AuthLayout>
  );
}