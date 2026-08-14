import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Check, QrCode } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { getErrorMessage, ordersApi } from '../lib/api';
import { toast } from 'sonner';

const SHIPPING_CITY = 'Thành phố Hồ Chí Minh';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated, isHydrating, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: SHIPPING_CITY,
    district: '',
    ward: '',
    note: '',
  });

  // Redirect to cart if empty
  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  useEffect(() => {
    if (!isHydrating && !isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' }, replace: true });
    }
  }, [isAuthenticated, isHydrating, navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || user.username || '',
      email: prev.email || user.email || '',
      phone: prev.phone || user.phone || '',
      address: prev.address || user.address || '',
    }));
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const shipping = totalPrice > 500000 ? 0 : 30000;
  const finalTotal = totalPrice + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const shippingAddress = [
      formData.address,
      formData.ward,
      formData.district,
      formData.city,
    ]
      .filter(Boolean)
      .join(', ');

    try {
      if (!formData.email.trim()) {
        toast.error('Vui lòng nhập email để thanh toán qua PayOS');
        return;
      }

      const response = await ordersApi.createPayOSCheckout({
        customerName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: SHIPPING_CITY,
        address: shippingAddress,
        note: formData.note.trim(),
      });

      await clearCart();
      window.location.assign(response.checkoutUrl);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 || isHydrating || !isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent px-3 py-5 sm:px-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/cart" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại giỏ hàng
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Thanh toán</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 lg:grid-cols-3 lg:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Contact Information */}
              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin liên hệ</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Họ và tên *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="Nguyễn Văn A"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Số điện thoại *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="0123456789"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Địa chỉ giao hàng</h2>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">Tỉnh/Thành phố *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        readOnly
                        required
                        className="mt-1 cursor-not-allowed bg-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="district">Quận/Huyện *</Label>
                      <Input
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        placeholder="Hoàn Kiếm"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ward">Phường/Xã *</Label>
                      <Input
                        id="ward"
                        name="ward"
                        value={formData.ward}
                        onChange={handleInputChange}
                        placeholder="Hàng Bài"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Địa chỉ cụ thể *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường..."
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note">Ghi chú đơn hàng (tùy chọn)</Label>
                    <textarea
                      id="note"
                      name="note"
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Ghi chú về đơn hàng, ví dụ: giao hàng vào giờ hành chính..."
                      rows={3}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Phương thức thanh toán</h2>
                <div className="flex items-center justify-between rounded-xl border-2 border-black bg-gray-50 p-4">
                  <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100"><QrCode className="h-5 w-5 text-cyan-700" /></div><div><p className="font-semibold text-gray-900">Thanh toán PayOS</p><p className="text-sm text-gray-500">Quét QR hoặc chuyển khoản qua cổng PayOS</p></div></div>
                  <Check className="h-5 w-5 text-black" />
                </div>
                <div className="mt-4 rounded-lg border border-cyan-100 bg-cyan-50 p-4"><p className="text-sm text-cyan-900">Sau khi bấm thanh toán, bạn sẽ được chuyển sang cổng PayOS để quét QR hoặc chuyển khoản.</p></div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-xl bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Đơn hàng của bạn</h2>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-900">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-gray-900">
                      {shipping === 0 ? (
                        <span className="text-green-600 font-semibold">Miễn phí</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-semibold text-gray-900">Tổng cộng</span>
                  <span className="text-2xl font-bold text-gray-900">{formatPrice(finalTotal)}</span>
                </div>

                <Button 
                  type="submit" 
                  disabled={isProcessing}
                  className="w-full bg-black text-white hover:bg-gray-800 py-6 text-base font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Đang xử lý...' : 'Thanh toán qua PayOS'}
                </Button>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Bằng cách đặt hàng, bạn đồng ý với{' '}
                  <a href="#" className="text-black hover:underline">Điều khoản dịch vụ</a>
                  {' '}và{' '}
                  <a href="#" className="text-black hover:underline">Chính sách bảo mật</a>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
