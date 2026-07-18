import { useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { AlertTriangle, CheckCircle, Clock, Home, RefreshCcw, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { usePaymentStatusPolling } from "../hooks/usePaymentStatusPolling";
import { getErrorMessage, ordersApi, type PaymentStatusResponse } from "../lib/api";

type PaymentResultMode = "return" | "cancel";

const terminalStatuses = new Set(["PAID", "CANCELLED", "FAILED", "REFUNDED"]);
const isTerminalPayment = (payment: PaymentStatusResponse) => terminalStatuses.has(payment.paymentStatus);

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export function PaymentResultPage({ mode }: { mode: PaymentResultMode }) {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode") || searchParams.get("ordercode");

  const loadPaymentStatus = useCallback(() => {
    if (!orderCode) return Promise.reject(new Error("Không tìm thấy mã giao dịch PayOS."));
    return ordersApi.getPaymentStatus(orderCode);
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
      ? "Thanh toán thành công"
      : isCancelled
        ? "Thanh toán đã hủy"
        : isFailed
          ? "Thanh toán thất bại"
          : hasTimedOut
            ? "Chưa nhận được xác nhận"
            : "Thanh toán đang chờ xử lý";

  const pendingDescription = mode === "cancel"
    ? "Hệ thống đang xác nhận trạng thái hủy trực tiếp với PayOS."
    : "Hệ thống đang đối soát giao dịch trực tiếp với PayOS.";
  const description = isPaid
    ? "Backend đã xác nhận giao dịch. Đơn hàng của bạn đang được xử lý."
    : isCancelled
      ? "PayOS đã xác nhận giao dịch bị hủy và đơn hàng chưa được thanh toán."
      : isFailed
        ? "Giao dịch không hoàn tất. Bạn có thể quay lại giỏ hàng để thử lại."
        : hasTimedOut
          ? "PayOS chưa trả trạng thái cuối cùng. Hãy bấm kiểm tra lại, không cần tạo thêm đơn hàng."
          : pendingDescription;

  const Icon = isPaid ? CheckCircle : isCancelled || isFailed ? XCircle : Clock;
  const iconClass = isPaid
    ? "bg-green-100 text-green-600"
    : isCancelled || isFailed
      ? "bg-red-100 text-red-600"
      : "bg-amber-100 text-amber-600";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className={`mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-12 w-12" />
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">{title}</h1>
        <p className="mb-8 text-gray-600">{isInitialLoading ? "Vui lòng chờ trong giây lát." : description}</p>

        <div className="mb-8 space-y-3 rounded-xl bg-gray-50 p-5 text-left">
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">Mã PayOS</span>
            <span className="break-all text-right text-sm font-semibold text-gray-900">{orderCode || "--"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">Trạng thái</span>
            <span className="text-sm font-semibold text-gray-900">{status || (isChecking ? "PENDING" : "--")}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">Đơn hàng</span>
            <span className="text-sm font-semibold text-gray-900">
              {payment?.orderId ? `#${payment.orderId.slice(-8).toUpperCase()}` : "--"}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-gray-500">Số tiền</span>
            <span className="text-sm font-semibold text-gray-900">
              {payment ? formatPrice(payment.amount) : "--"}
            </span>
          </div>

          {(displayError || payment?.reconciliationWarning || hasTimedOut) && (
            <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError || payment?.reconciliationWarning || "Quá trình xác nhận đang lâu hơn dự kiến."}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={refresh}
            disabled={isChecking || !orderCode}
            className="w-full"
          >
            <RefreshCcw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Đang đối soát" : "Kiểm tra lại"}
          </Button>
          <Link to="/" className="block">
            <Button className="w-full rounded-xl bg-black py-6 text-base font-semibold text-white hover:bg-gray-800">
              <Home className="mr-2 h-5 w-5" />
              Về trang chủ
            </Button>
          </Link>
          {(isCancelled || isFailed) && (
            <Link to="/checkout" className="block text-center text-sm font-medium text-gray-600 hover:text-gray-900">
              Quay lại thanh toán
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
