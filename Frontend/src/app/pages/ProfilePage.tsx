import { useEffect, useState } from "react";
import { Coins, Sparkles, RefreshCw } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import { aiPackageApi, getErrorMessage, issueReportsApi, ordersApi, profileApi, resolveAssetUrl, type IssueReport } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import type { Order, UserRole } from "../types";

const roleLabels: Record<UserRole, string> = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  shipper: "Nhân viên giao hàng",
  user: "Khách hàng",
};

const orderStatusLabels: Record<Order["status"], string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  packing: "Đang đóng gói",
  shipping: "Đang giao hàng",
  completed: "Đã giao",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
  delivery_failed: "Giao hàng thất bại",
  returned: "Đã trả hàng",
};

const paymentStatusLabels: Record<Order["paymentStatus"], string> = {
  unpaid: "Chưa thanh toán",
  pending: "Đang xử lý",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
  refunded: "Đã hoàn tiền",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    username: user?.username || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailForm, setEmailForm] = useState({
    oldOtp: "",
    newEmail: "",
    newOtp: "",
  });
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [aiCredits, setAiCredits] = useState<number | null>(null);
  const [isAiBalanceLoading, setIsAiBalanceLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [issueReports, setIssueReports] = useState<IssueReport[]>([]);
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [reportForm, setReportForm] = useState({ subject: "", description: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingOldEmailOtp, setIsSendingOldEmailOtp] = useState(false);
  const [isVerifyingOldEmailOtp, setIsVerifyingOldEmailOtp] = useState(false);
  const [isSendingNewEmailOtp, setIsSendingNewEmailOtp] = useState(false);
  const [isVerifyingNewEmailOtp, setIsVerifyingNewEmailOtp] = useState(false);

  const loadOrders = async () => {
    setIsOrdersLoading(true);
    try {
      const response = await ordersApi.getMy({ page: 1, limit: 50 });
      setOrders(response.orders);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsOrdersLoading(false);
    }
  };

  const loadIssueReports = async () => {
    setIsReportsLoading(true);
    try {
      const response = await issueReportsApi.getMy({ limit: 30 });
      setIssueReports(response.reports);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsReportsLoading(false);
    }
  };

  const handleIssueReportSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSendingReport(true);
    try {
      await issueReportsApi.create({ subject: reportForm.subject.trim(), description: reportForm.description.trim() });
      setReportForm({ subject: "", description: "" });
      toast.success("Đã gửi báo cáo đến quản trị viên");
      await loadIssueReports();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingReport(false);
    }
  };

  useEffect(() => {
    setProfileForm({
      username: user?.username || "",
      phone: user?.phone || "",
      address: user?.address || "",
    });
  }, [user?.username, user?.phone, user?.address]);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const profile = await refreshProfile();

        if (isMounted && profile) {
          setProfileForm({
            username: profile.username || "",
            phone: profile.phone || "",
            address: profile.address || "",
          });
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    void loadOrders();
    void loadIssueReports();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadAiBalance = async () => {
      try {
        const response = await aiPackageApi.getMyBalance();

        if (isMounted) {
          setAiCredits(response.balance);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(getErrorMessage(error));
        }
      } finally {
        if (isMounted) {
          setIsAiBalanceLoading(false);
        }
      }
    };

    void loadAiBalance();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      await profileApi.updateProfile({
        username: profileForm.username.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
      });
      await refreshProfile();
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingAvatar(true);

    try {
      await profileApi.uploadAvatar(file);
      await refreshProfile();
      toast.success("Cập nhật avatar thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSendPasswordOtp = async () => {
    setIsSendingPasswordOtp(true);

    try {
      await profileApi.requestChangePasswordOtp();
      toast.success("OTP đổi mật khẩu đã được gửi về email");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);

    try {
      await profileApi.verifyChangePasswordOtp(passwordForm);
      setPasswordForm({
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success("Đổi mật khẩu thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendOldEmailOtp = async () => {
    setIsSendingOldEmailOtp(true);

    try {
      await profileApi.requestChangeEmailOldOtp();
      toast.success("OTP xác thực email hiện tại đã được gửi");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingOldEmailOtp(false);
    }
  };

  const handleVerifyOldEmailOtp = async () => {
    setIsVerifyingOldEmailOtp(true);

    try {
      await profileApi.verifyChangeEmailOldOtp(emailForm.oldOtp.trim());
      toast.success("Xác thực email hiện tại thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsVerifyingOldEmailOtp(false);
    }
  };

  const handleSendNewEmailOtp = async () => {
    setIsSendingNewEmailOtp(true);

    try {
      await profileApi.requestChangeEmailNewOtp(emailForm.newEmail.trim());
      toast.success("OTP xác thực email mới đã được gửi");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSendingNewEmailOtp(false);
    }
  };

  const handleVerifyNewEmailOtp = async () => {
    setIsVerifyingNewEmailOtp(true);

    try {
      await profileApi.verifyChangeEmailNewOtp(emailForm.newOtp.trim());
      await refreshProfile();
      setEmailForm({
        oldOtp: "",
        newEmail: "",
        newOtp: "",
      });
      toast.success("Đổi email thành công");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsVerifyingNewEmailOtp(false);
    }
  };

  const avatarUrl = resolveAssetUrl(user?.avatar?.url);

  const paymentMethodLabels: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  vnpay: "Ví / Cổng VNPAY",
  momo: "Ví MoMo",
  bank_transfer: "Chuyển khoản ngân hàng",
  ai_credits: "Thanh toán bằng AI Credits",
};

function getPaymentBadgeClass(status: Order["paymentStatus"]) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":
    case "unpaid":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "failed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "refunded":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function getPaymentMethodName(order: any): string {
  // Nếu order.payment là một Object (chứa thông tin giao dịch)
  if (typeof order.payment === "object" && order.payment !== null) {
    const provider = order.payment.provider;
    if (provider) {
      return paymentMethodLabels[provider] || provider.toUpperCase();
    }
  }

  // Nếu order.payment hoặc order.paymentMethod là dạng string
  const methodKey = (typeof order.payment === "string" ? order.payment : order.paymentMethod) || "cod";
  return paymentMethodLabels[methodKey] || methodKey.toUpperCase();
}

const [aiTransactions, setAiTransactions] = useState<any[]>([]);
const loadAiTransactions = async () => {
  try {
    const response = await aiPackageApi.getMyTransactions();
    
    // Nếu response là mảng thì dùng trực tiếp, nếu là object thì lấy .transactions
    const list = Array.isArray(response) 
      ? response 
      : (response?.transactions || []);

    setAiTransactions(list);
  } catch (error) {
    console.error("Không thể tải lịch sử AI:", error);
  }
};

useEffect(() => {
  void loadOrders();
  void loadIssueReports();
  void loadAiTransactions(); // <-- Gọi thêm hàm này
}, []);

const aiStatusLabels: Record<string, string> = {
  PAID: "Thành công",
  SUCCESS: "Thành công",
  PENDING: "Đang xử lý",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
};

function getAiStatusBadgeClass(status: string) {
  const s = status?.toUpperCase();
  switch (s) {
    case "PAID":
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "CANCELLED":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}


  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <Card className="lg:w-80 shrink-0">
            <CardHeader>
              <CardTitle>Tài khoản của bạn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col items-center text-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.username || "Avatar"}
                    className="h-24 w-24 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-black text-white flex items-center justify-center text-3xl font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}

                <div className="mt-4">
                  <p className="text-xl font-semibold">{user?.username || "--"}</p>
                  <p className="text-sm text-gray-500">{user?.email || "--"}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Vai trò</span>
                  <Badge variant={user?.role === "admin" ? "default" : "secondary"}>
                    {user?.role ? roleLabels[user.role] : "--"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Ngày tạo</span>
                  <span>{formatDate(user?.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Cập nhật</span>
                  <span>{formatDate(user?.updatedAt)}</span>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-blue-950">AI credits</p>
                    <p className="text-xs text-blue-700">Dùng cho thử đồ và mix-match AI</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#3977ed]">
                    <Coins className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-bold text-blue-950">
                      {isAiBalanceLoading ? "--" : aiCredits ?? 0}
                    </p>
                    <p className="text-xs text-blue-700">Số dư hiện tại</p>
                  </div>
                  <Link to="/ai-packages">
                    <Button size="sm" className="bg-[#3977ed] text-white hover:bg-[#2868db]">
                      <Sparkles className="h-4 w-4" />
                      Mua gói
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar">Ảnh đại diện</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
                <p className="text-xs text-gray-500">
                  {isUploadingAvatar
                    ? "Đang tải ảnh lên..."
                    : "Cập nhật ảnh đại diện của bạn. Hỗ trợ định dạng JPG, PNG, GIF."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex-1">
            <Tabs defaultValue="profile" className="space-y-4">
              <TabsList className="grid h-auto w-full grid-cols-2 sm:grid-cols-6">
                <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                <TabsTrigger value="payments">Thanh toán</TabsTrigger>
                <TabsTrigger value="issues">Báo cáo sự cố</TabsTrigger>
                <TabsTrigger value="password">Mật khẩu</TabsTrigger>
                <TabsTrigger value="email">Đổi email</TabsTrigger>
              </TabsList>

              <TabsContent value="orders">
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Đơn hàng của tôi</CardTitle>
                      <CardDescription>Theo dõi sản phẩm đã mua và trạng thái giao hàng.</CardDescription>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void loadOrders()} disabled={isOrdersLoading}>
                      {isOrdersLoading ? "Đang tải..." : "Làm mới"}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <div className="rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">Đang tải đơn hàng...</div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-10 text-center">
                        <p className="font-semibold text-gray-900">Bạn chưa có đơn hàng nào</p>
                        <p className="mt-1 text-sm text-gray-500">Các đơn hàng sau khi mua sẽ xuất hiện tại đây.</p>
                        <Link to="/">
                          <Button className="mt-4 bg-[#3977ed] text-white hover:bg-[#2868db]">Mua sắm ngay</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <article key={order._id} className="overflow-hidden rounded-xl border bg-white">
                            <div className="flex flex-col gap-3 border-b bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Đơn #{order._id.slice(-8).toUpperCase()}</p>
                                <p className="mt-0.5 text-xs text-gray-500">Đặt lúc {formatDate(order.createdAt)}</p>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs font-medium">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">{orderStatusLabels[order.status]}</span>
                                <span className={`rounded-full px-3 py-1 ${order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                                  {paymentStatusLabels[order.paymentStatus]}
                                </span>
                              </div>
                            </div>

                            <div className="divide-y">
                              {order.items.map((item, index) => {
                                const productId = typeof item.product === "string" ? item.product : item.product?.id;

                                return (
                                  <div key={`${productId || item.name}-${index}`} className="flex gap-3 p-4">
                                    <img src={resolveAssetUrl(item.image) || "/favicon.svg"} alt={item.name} className="h-20 w-16 shrink-0 rounded-lg bg-gray-100 object-contain" />
                                    <div className="min-w-0 flex-1">
                                      {productId ? (
                                        <Link to={`/product/${productId}`} className="line-clamp-2 text-sm font-semibold text-gray-900 hover:text-[#3977ed]">{item.name}</Link>
                                      ) : (
                                        <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.name}</p>
                                      )}
                                      <p className="mt-1 text-xs text-gray-500">{[item.size && `Size ${item.size}`, item.color].filter(Boolean).join(" · ") || "Không có phân loại"}</p>
                                      <p className="mt-2 text-xs text-gray-600">{formatCurrency(item.price)} × {item.quantity}</p>
                                    </div>
                                    <p className="shrink-0 text-sm font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex flex-col gap-1 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-gray-500">Giao đến: {order.address}</p>
                              <p className="font-semibold text-gray-900">Tổng cộng: <span className="text-[#3977ed]">{formatCurrency(order.totalAmount)}</span></p>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="issues">
                <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Báo cáo sự cố</CardTitle>
                      <CardDescription>Mô tả vấn đề bạn gặp phải. Quản trị viên sẽ tiếp nhận và phản hồi tại đây.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={handleIssueReportSubmit}>
                        <div className="space-y-2">
                          <Label htmlFor="issue-subject">Tiêu đề</Label>
                          <Input id="issue-subject" maxLength={120} required value={reportForm.subject} onChange={(event) => setReportForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Ví dụ: Không thể thanh toán đơn hàng" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="issue-description">Nội dung sự cố</Label>
                          <Textarea id="issue-description" maxLength={3000} required value={reportForm.description} onChange={(event) => setReportForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả các bước đã thực hiện, lỗi hiển thị và thời điểm xảy ra..." className="min-h-36" />
                          <p className="text-right text-xs text-gray-400">{reportForm.description.length}/3000</p>
                        </div>
                        <Button type="submit" disabled={isSendingReport} className="w-full bg-[#3977ed] text-white hover:bg-[#2868db]">
                          {isSendingReport ? "Đang gửi..." : "Gửi báo cáo"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex-row items-start justify-between gap-4">
                      <div><CardTitle>Báo cáo đã gửi</CardTitle><CardDescription>Theo dõi tiến độ xử lý từ quản trị viên.</CardDescription></div>
                      <Button type="button" variant="outline" size="sm" onClick={() => void loadIssueReports()} disabled={isReportsLoading}>Làm mới</Button>
                    </CardHeader>
                    <CardContent>
                      {isReportsLoading ? <p className="py-8 text-center text-sm text-gray-500">Đang tải...</p> : issueReports.length === 0 ? <p className="rounded-lg border border-dashed py-8 text-center text-sm text-gray-500">Bạn chưa gửi báo cáo nào.</p> : (
                        <div className="space-y-3">
                          {issueReports.map((report) => {
                            const labels = { new: "Mới", in_progress: "Đang xử lý", resolved: "Đã giải quyết", rejected: "Từ chối" };
                            return <article key={report._id} className="rounded-xl border p-4">
                              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-900">{report.subject}</h3><p className="mt-1 text-xs text-gray-500">{formatDate(report.createdAt)}</p></div><Badge variant="secondary">{labels[report.status]}</Badge></div>
                              <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-700">{report.description}</p>
                              {report.adminNote && <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-900"><p className="mb-1 font-semibold">Phản hồi từ quản trị viên</p><p className="whitespace-pre-wrap">{report.adminNote}</p></div>}
                            </article>;
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Cập nhật thông tin cá nhân</CardTitle>
                    <CardDescription>
                      Chỉnh sửa họ tên, số điện thoại và thông tin cá nhân của bạn.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileSubmit} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profile-username">Tên đăng nhập</Label>
                          <Input
                            id="profile-username"
                            value={profileForm.username}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                username: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="profile-email">Email hiện tại</Label>
                          <Input
                            id="profile-email"
                            value={user?.email || ""}
                            disabled
                          />
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="profile-phone">Số điện thoại</Label>
                          <Input
                            id="profile-phone"
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="0912345678"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Trạng thái</Label>
                          <Input value={user?.isActive ? "Đang hoạt động" : "Đã khóa"} disabled />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profile-address">Địa chỉ</Label>
                        <Textarea
                          id="profile-address"
                          value={profileForm.address}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              address: e.target.value,
                            }))
                          }
                          placeholder="Nhập địa chỉ giao hàng"
                        />
                      </div>

                      <Button type="submit" disabled={isProfileLoading || isSavingProfile}>
                        {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments">
                <Card>
                  <CardHeader className="flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle>Lịch sử thanh toán</CardTitle>
                      <CardDescription>
                        Danh sách tất cả giao dịch thanh toán đơn hàng và nạp gói AI Credits.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void loadOrders();
                        void loadAiTransactions();
                      }}
                      disabled={isOrdersLoading}
                    >
                      <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isOrdersLoading ? "animate-spin" : ""}`} />
                      Làm mới
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* 1. Thanh toán đơn hàng */}
                      <div>
                        <h4 className="mb-3 font-semibold text-gray-900">1. Thanh toán đơn hàng</h4>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="w-full text-left text-sm text-gray-600">
                            <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
                              <tr>
                                <th className="px-4 py-3">Mã đơn</th>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3">Phương thức</th>
                                <th className="px-4 py-3">Số tiền</th>
                                <th className="px-4 py-3 text-right">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {orders.map((order) => (
                                <tr key={`order-${order._id}`} className="hover:bg-gray-50/60">
                                  <td className="px-4 py-3.5 font-medium text-gray-900">
                                    #{order._id.slice(-8).toUpperCase()}
                                  </td>
                                  <td className="px-4 py-3.5 text-xs text-gray-500">
                                    {formatDate(order.createdAt)}
                                  </td>
                                  <td className="px-4 py-3.5">{getPaymentMethodName(order)}</td>
                                  <td className="px-4 py-3.5 font-semibold text-gray-900">
                                    {formatCurrency(order.totalAmount)}
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getPaymentBadgeClass(order.paymentStatus)}`}>
                                      {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* 2. Mua gói AI Credits */}
                      <div>
                        <h4 className="mb-3 font-semibold text-gray-900">2. Mua gói AI Credits</h4>
                        {aiTransactions.length === 0 ? (
                          <p className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-500">
                            Chưa có giao dịch mua gói AI nào.
                          </p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border">
                            <table className="w-full text-left text-sm text-gray-600">
                              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-700">
                                <tr>
                                  <th className="px-4 py-3">Tên gói / Giao dịch</th>
                                  <th className="px-4 py-3">Thời gian</th>
                                  <th className="px-4 py-3">Credits nhận</th>
                                  <th className="px-4 py-3">Số tiền</th>
                                  <th className="px-4 py-3 text-right">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {aiTransactions.map((tx) => (
                                  <tr key={`ai-${tx._id}`} className="hover:bg-gray-50/60">
                                    <td className="px-4 py-3.5 font-medium text-gray-900">
                                      {tx.packageName || tx.description || "Gói AI Credits"}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-gray-500">
                                      {formatDate(tx.createdAt)}
                                    </td>
                                    <td className="px-4 py-3.5 text-blue-600 font-semibold">
                                      +{tx.credits || 0} credits
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-gray-900">
                                      {formatCurrency(tx.amount || 0)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getAiStatusBadgeClass(tx.status)}`}>
                                        {aiStatusLabels[tx.status?.toUpperCase()] || tx.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Đổi mật khẩu bằng OTP</CardTitle>
                    <CardDescription>
                      Bước 1 gửi OTP, bước 2 nhập OTP và mật khẩu mới
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border border-dashed p-4">
                      <p className="text-sm text-gray-600 mb-3">
                        OTP sẽ được gửi tới email hiện tại của bạn:{" "}
                        <strong>{user?.email}</strong>
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSendPasswordOtp}
                        disabled={isSendingPasswordOtp}
                      >
                        {isSendingPasswordOtp ? "Đang gửi OTP..." : "Gửi OTP đổi mật khẩu"}
                      </Button>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password-otp">OTP</Label>
                        <Input
                          id="password-otp"
                          value={passwordForm.otp}
                          onChange={(e) =>
                            setPasswordForm((prev) => ({
                              ...prev,
                              otp: e.target.value,
                            }))
                          }
                          placeholder="Nhập OTP từ email"
                          required
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="new-password">Mật khẩu mới</Label>
                          <Input
                            id="new-password"
                            type="password"
                            minLength={6}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Xác nhận mật khẩu</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            minLength={6}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm((prev) => ({
                                ...prev,
                                confirmPassword: e.target.value,
                              }))
                            }
                            required
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isChangingPassword}>
                        {isChangingPassword ? "Đang đổi mật khẩu..." : "Xác nhận đổi mật khẩu"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email">
                <Card>
                  <CardHeader>
                    <CardTitle>Đổi email bằng 4 bước xác thực</CardTitle>
                    <CardDescription>
                      Để bảo vệ tài khoản, bạn cần xác nhận email hiện tại trước khi đổi sang email mới.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border p-4 space-y-3">
                        <h3 className="font-semibold">Bước 1 và 2: Email hiện tại</h3>
                        <p className="text-sm text-gray-600">
                          Gửi OTP đến <strong>{user?.email}</strong>, sau đó nhập mã OTP để xác thực.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendOldEmailOtp}
                          disabled={isSendingOldEmailOtp}
                        >
                          {isSendingOldEmailOtp ? "Đang gửi OTP..." : "Gửi OTP email hiện tại"}
                        </Button>

                        <div className="space-y-2">
                          <Label htmlFor="old-email-otp">OTP email hiện tại</Label>
                          <Input
                            id="old-email-otp"
                            value={emailForm.oldOtp}
                            onChange={(e) =>
                              setEmailForm((prev) => ({
                                ...prev,
                                oldOtp: e.target.value,
                              }))
                            }
                            placeholder="Nhập OTP bước 2"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleVerifyOldEmailOtp}
                          disabled={isVerifyingOldEmailOtp}
                        >
                          {isVerifyingOldEmailOtp ? "Đang xác thực..." : "Xác thực OTP email hiện tại"}
                        </Button>
                      </div>

                      <div className="rounded-xl border p-4 space-y-3">
                        <h3 className="font-semibold">Bước 3 và 4: Email mới</h3>
                        <p className="text-sm text-gray-600">
                          Sau khi bước 2 thành công, nhập email mới để nhận OTP xác thực cuối cùng.
                        </p>

                        <div className="space-y-2">
                          <Label htmlFor="new-email">Email mới</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={emailForm.newEmail}
                            onChange={(e) =>
                              setEmailForm((prev) => ({
                                ...prev,
                                newEmail: e.target.value,
                              }))
                            }
                            placeholder="new-email@example.com"
                          />
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendNewEmailOtp}
                          disabled={isSendingNewEmailOtp}
                        >
                          {isSendingNewEmailOtp ? "Đang gửi OTP..." : "Gửi OTP email mới"}
                        </Button>

                        <div className="space-y-2">
                          <Label htmlFor="new-email-otp">OTP email mới</Label>
                          <Input
                            id="new-email-otp"
                            value={emailForm.newOtp}
                            onChange={(e) =>
                              setEmailForm((prev) => ({
                                ...prev,
                                newOtp: e.target.value,
                              }))
                            }
                            placeholder="Nhập OTP bước 4"
                          />
                        </div>

                        <Button
                          type="button"
                          onClick={handleVerifyNewEmailOtp}
                          disabled={isVerifyingNewEmailOtp}
                        >
                          {isVerifyingNewEmailOtp ? "Đang cập nhật..." : "Xác nhận đổi email"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
