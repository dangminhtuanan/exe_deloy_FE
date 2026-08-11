import { type ReactNode, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { getErrorMessage, ordersApi, paymentsApi } from "../lib/api";
import type { Order, Payment } from "../types";

const money = (value?: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
export function AdminOrderPaymentDetailsContent() {
  const [orders, setOrders] = useState<Order[]>([]); const [payments, setPayments] = useState<Payment[]>([]); const [loading, setLoading] = useState(true); const [detail, setDetail] = useState<Order | Payment | null>(null); const [kind, setKind] = useState<"order" | "payment">("order");
  const load = async () => { setLoading(true); try { const [orderData, paymentData] = await Promise.all([ordersApi.getAll({ limit: 25 }), paymentsApi.getAll({ limit: 25 })]); setOrders(orderData.orders); setPayments(paymentData.payments); } catch (error) { toast.error(getErrorMessage(error)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const openOrder = async (id: string) => { try { setKind("order"); setDetail((await ordersApi.getById(id)).order); } catch (error) { toast.error(getErrorMessage(error)); } };
  const openPayment = async (id: string) => { try { setKind("payment"); setDetail((await paymentsApi.getById(id)).payment); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <><div className="grid gap-6 xl:grid-cols-2"><List title="Tra cứu đơn hàng" description="25 đơn gần nhất" loading={loading}><TableHeader><TableRow><TableHead>Mã đơn</TableHead><TableHead>Khách hàng</TableHead><TableHead>Tổng</TableHead><TableHead /></TableRow></TableHeader><TableBody>{orders.map((order) => <TableRow key={order._id}><TableCell>#{order._id.slice(-8)}</TableCell><TableCell>{order.customerName}</TableCell><TableCell>{money(order.totalAmount)}</TableCell><TableCell><Button size="icon" variant="outline" onClick={() => void openOrder(order._id)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></List><List title="Tra cứu thanh toán" description="25 giao dịch gần nhất" loading={loading}><TableHeader><TableRow><TableHead>Mã</TableHead><TableHead>Nhà cung cấp</TableHead><TableHead>Số tiền</TableHead><TableHead /></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment._id}><TableCell>#{payment._id.slice(-8)}</TableCell><TableCell>{payment.provider}</TableCell><TableCell>{money(payment.amount)}</TableCell><TableCell><Button size="icon" variant="outline" onClick={() => void openPayment(payment._id)}><Eye className="h-4 w-4" /></Button></TableCell></TableRow>)}</TableBody></List></div><Dialog open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto"><DialogHeader><DialogTitle>{kind === "order" ? "Chi tiết đơn hàng" : "Chi tiết thanh toán"}</DialogTitle></DialogHeader><pre className="whitespace-pre-wrap break-words rounded bg-slate-50 p-4 text-xs">{JSON.stringify(detail, null, 2)}</pre></DialogContent></Dialog></>;
}
function List({ title, description, loading, children }: { title: string; description: string; loading: boolean; children: ReactNode }) { return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><Table>{children}{loading && <caption className="p-4">Đang tải...</caption>}</Table></CardContent></Card>; }
