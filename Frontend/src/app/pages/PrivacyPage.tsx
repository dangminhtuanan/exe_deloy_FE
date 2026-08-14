import { Link } from "react-router";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/ui/button";

export function PrivacyPage() {
  return (
    <AuthLayout
      title="Chính sách bảo mật"
      description="Chúng tôi cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn tại Outfio."
    >
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-950">
          Chính sách bảo mật
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Cập nhật lần cuối: Tháng 8/2026
        </p>
      </div>

      <div className="space-y-6 text-sm text-slate-600 leading-relaxed max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Thông tin thu thập</h2>
          <p>
            Chúng tôi thu thập thông tin bạn cung cấp trực tiếp khi đăng ký tài khoản (như Họ tên, Email, Số điện thoại, Địa chỉ giao hàng) để xử lý đơn hàng và nâng cao trải nghiệm mua sắm.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Mục đích sử dụng dữ liệu</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Xác nhận và xử lý đơn hàng mua sắm thời trang của bạn.</li>
            <li>Gửi thông báo cập nhật về trạng thái đơn hàng.</li>
            <li>Cung cấp dịch vụ chăm sóc khách hàng và phản hồi thắc mắc.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Cam kết bảo mật</h2>
          <p>
            Outfio áp dụng các biện pháp mã hóa và an ninh mạng hiện đại nhằm đảm bảo dữ liệu cá nhân của bạn không bị truy cập, chia sẻ hoặc tiết lộ trái phép.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Chia sẻ thông tin với bên thứ ba</h2>
          <p>
            Chúng tôi chỉ chia sẻ thông tin cần thiết với các đối tác vận chuyển (Shipper) và đối tác thanh toán để hoàn tất giao dịch mua hàng của bạn. Chúng tôi tuyệt đối không bán dữ liệu của bạn cho bên thứ ba.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Quyền của bạn</h2>
          <p>
            Bạn có quyền xem, chỉnh sửa hoặc yêu cầu xóa dữ liệu cá nhân của mình bất kỳ lúc nào bằng cách truy cập trang quản lý tài khoản hoặc liên hệ bộ phận hỗ trợ.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
        <Link to="/login">
          <Button variant="outline" size="sm">
            Quay lại Đăng nhập
          </Button>
        </Link>
        <Link to="/terms" className="text-xs font-semibold text-[#3977ed] hover:underline">
          Xem Điều khoản dịch vụ &rarr;
        </Link>
      </div>
    </AuthLayout>
  );
}