const AI_PAYMENT_CONTEXT_PREFIX = "outfio:ai-payment:";

export interface AIPaymentContext {
  amount: number;
  orderCode: number;
  packageName: string;
  paymentId: string;
  transactionId: string;
}

export function saveAIPaymentContext(context: AIPaymentContext) {
  try {
    sessionStorage.setItem(
      `${AI_PAYMENT_CONTEXT_PREFIX}${context.orderCode}`,
      JSON.stringify(context),
    );
  } catch {
    // Payment reconciliation still works when browser storage is unavailable.
  }
}

export function getAIPaymentContext(orderCode?: string | null): AIPaymentContext | null {
  if (!orderCode) return null;

  try {
    const rawValue = sessionStorage.getItem(`${AI_PAYMENT_CONTEXT_PREFIX}${orderCode}`);
    return rawValue ? (JSON.parse(rawValue) as AIPaymentContext) : null;
  } catch {
    return null;
  }
}
