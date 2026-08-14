import { useCallback, useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Coins,
  Home,
  PackageCheck,
  RefreshCcw,
  XCircle,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { usePaymentStatusPolling } from "../hooks/usePaymentStatusPolling";
import {
  aiPackageApi,
  getErrorMessage,
  type AIPackagePaymentStatusResponse,
} from "../lib/api";
import { getAIPaymentContext } from "../lib/payment-storage";

type AIPaymentResultMode = "return" | "cancel";

const terminalStatuses = new Set(["PAID", "CANCELLED", "FAILED", "REFUNDED"]);
const isTerminalPayment = (payment: AIPackagePaymentStatusResponse) =>
  terminalStatuses.has(payment.paymentStatus);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

export function AIPaymentResultPage({ mode }: { mode: AIPaymentResultMode }) {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode") || searchParams.get("ordercode");
  const paymentContext = useMemo(() => getAIPaymentContext(orderCode), [orderCode]);

  const loadPaymentStatus = useCallback(() => {
    if (!orderCode) return Promise.reject(new Error("Không tìm thấy mã giao dịch PayOS."));
    return aiPackageApi.getPaymentStatus(orderCode);
  }, [orderCode]);

  const {
    data: payment,
    error,
    hasTimedOut,
    isChecking,
    refresh,
  } = usePaymentStatusPolling({
    enabled: Boolean(orderCode),
    load: loadPaymentStatus,
    isTerminal: isTerminalPayment,
  });

  const status = payment?.paymentStatus;
  const isPaid = status === "PAID";
  const isCancelled = status === "CANCELLED";
  const isFailed = status === "FAILED" || status === "REFUNDED";
  const isInitialLoading = isChecking && !payment;
  const displayError = !orderCode
    ? "Không tìm thấy mã giao dịch PayOS."
    : error
      ? getErrorMessage(error)
      : "";

  const title = isInitialLoading
    ? "Đang kiểm tra thanh toán"
    : isPaid
      ? "Gói AI đã được kích hoạt"
      : isCancelled
        ? "Thanh toán gói AI đã hủy"
        : isFailed
          ? "Thanh toán gói AI thất bại"
          : hasTimedOut
            ? "Chưa nhận được xác nhận"
            : "Thanh toán đang chờ xác nhận";

  const pendingDescription = mode === "cancel"
    ? "Hệ thống đang xác nhận yêu cầu hủy giao dịch."
    : "Hệ thống đang kiểm tra giao dịch. Vui lòng giữ nguyên trang trong giây lát.";
  const description = isPaid
    ? "Credit đã được cộng vào tài khoản của bạn."
    : isCancelled
      ? "Giao dịch đã được PayOS xác nhận hủy và tài khoản chưa được cộng credit."
      : isFailed
        ? "Giao dịch không hoàn tất nên tài khoản chưa được cộng credit."
        : hasTimedOut
          ? "PayOS chưa trả trạng thái cuối cùng. Bạn có thể bấm kiểm tra lại mà không tạo giao dịch mới."
          : pendingDescription;

  const Icon = isPaid ? CheckCircle : isCancelled || isFailed ? XCircle : Clock;
  const iconClass = isPaid
    ? "bg-emerald-100 text-emerald-600"
    : isCancelled || isFailed
      ? "bg-red-100 text-red-600"
      : "bg-amber-100 text-amber-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-4 py-16">
      <div className="w-full max-w-lg rounded-lg border bg-white p-5 text-center shadow-sm sm:p-8">
        <div className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-12 w-12" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-950">{title}</h1>
        <p className="mb-8 text-gray-600">{isInitialLoading ? "Vui lòng chờ trong giây lát." : description}</p>

        <div className="mb-8 rounded-lg bg-gray-50 p-5 text-left">
          <div className="space-y-3">
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Mã PayOS</span>
              <span className="break-all text-right text-sm font-semibold text-gray-900">{orderCode || "--"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Trạng thái</span>
              <span className="text-sm font-semibold text-gray-900">{status || (isChecking ? "PENDING" : "--")}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Gói</span>
              <span className="text-sm font-semibold text-gray-900">{paymentContext?.packageName || "Gói AI"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Credit</span>
              <span className="text-sm font-semibold text-gray-900">{payment?.credits ?? "--"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Số tiền</span>
              <span className="text-sm font-semibold text-gray-900">
                {payment || paymentContext
                  ? formatCurrency(payment?.amount ?? paymentContext?.amount ?? 0)
                  : "--"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">Số dư hiện tại</span>
              <span className="text-sm font-semibold text-gray-900">{payment?.balance ?? "--"}</span>
            </div>
          </div>

          {(displayError || payment?.reconciliationWarning || hasTimedOut) && (
            <div className="mt-4 flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError || payment?.reconciliationWarning || "Quá trình xác nhận đang lâu hơn dự kiến."}</span>
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link to="/ai-packages">
            <Button className="w-full bg-gray-950 text-white hover:bg-gray-800">
              <PackageCheck className="h-4 w-4" />
              Gói của tôi
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline" className="w-full">
              <Coins className="h-4 w-4" />
              Tài khoản
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={refresh}
            disabled={isChecking || !orderCode}
            className="sm:col-span-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Đang đối soát" : "Kiểm tra lại"}
          </Button>
          <Link to="/" className="sm:col-span-2">
            <Button variant="ghost" className="w-full">
              <Home className="h-4 w-4" />
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
