import { useEffect, useState } from "react";
import { History, RefreshCcw, UserPlus, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { getErrorMessage, shippingApi, usersApi } from "../lib/api";
import type { ShippingRecord, UserProfile } from "../types";

const historyStatusLabels: Record<string, string> = {
  pending: "Chờ lấy hàng",
  assigned: "Đã phân công người giao hàng",
  picked_up: "Đã lấy hàng",
  in_transit: "Đang vận chuyển",
  out_for_delivery: "Đang giao đến khách",
  delivered: "Đã giao hàng",
  failed: "Giao hàng thất bại",
  returned: "Đã hoàn hàng",
  cancelled: "Đã hủy giao hàng",
};

const systemTextLabels: Record<string, string> = {
  "Shipping record created": "Đã tạo thông tin giao hàng",
  "Shipper assigned": "Đã phân công người giao hàng",
  "Shipment picked up": "Người giao hàng đã lấy hàng",
  "Shipment in transit": "Đơn hàng đang được vận chuyển",
  "Out for delivery": "Đơn hàng đang được giao đến khách",
  "Shipment delivered": "Đơn hàng đã được giao thành công",
  "Delivery failed": "Giao hàng không thành công",
  "Shipment returned": "Đơn hàng đã được hoàn trả",
  "Shipment cancelled": "Đã hủy giao hàng",
};

function translateHistoryText(value?: string) {
  if (!value) return "--";
  if (/^Shipper .+ assigned$/i.test(value)) return `Đã phân công người giao hàng: ${value.replace(/^Shipper\s+|\s+assigned$/gi, "")}`;
  return systemTextLabels[value] || value;
}

export function AdminShippingAdvancedContent() {
  const [shipments, setShipments] = useState<ShippingRecord[]>([]); const [shippers, setShippers] = useState<UserProfile[]>([]); const [loading, setLoading] = useState(true); const [history, setHistory] = useState<ShippingRecord["updates"] | null>(null);
  const load = async () => { setLoading(true); try { const [shipping, users] = await Promise.all([shippingApi.getAll({ limit: 100 }), usersApi.getAll({ limit: 200 })]); setShipments(shipping.data); setShippers(users.users.filter((u) => u.role === "shipper" && u.isActive)); } catch (error) { toast.error(getErrorMessage(error)); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, []);
  const assign = async (shipment: ShippingRecord, shipperId: string) => { if (!shipperId) return; try { await shippingApi.assignShipper(shipment._id, shipperId); toast.success("Đã gán shipper"); await load(); } catch (error) { toast.error(getErrorMessage(error)); } };
  const showHistory = async (id: string) => { try { const response = await shippingApi.getHistory(id); setHistory(response.data.updates); } catch (error) { toast.error(getErrorMessage(error)); } };
  const cancel = async (shipment: ShippingRecord) => { const reason = window.prompt("Lý do hủy giao hàng:"); if (reason === null) return; try { await shippingApi.cancel(shipment._id, reason); toast.success("Đã hủy giao hàng"); await load(); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <><Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Giao hàng nâng cao</CardTitle><CardDescription>Gán shipper, xem lịch sử và hủy giao hàng.</CardDescription></div><Button variant="outline" size="icon" onClick={() => void load()}><RefreshCcw className="h-4 w-4" /></Button></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Mã vận đơn</TableHead><TableHead>Khách hàng</TableHead><TableHead>Shipper</TableHead><TableHead>Gán shipper</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{loading ? <Row text="Đang tải..." /> : shipments.map((shipment) => <TableRow key={shipment._id}><TableCell>{shipment.trackingNumber}</TableCell><TableCell>{shipment.order?.customerName || "--"}</TableCell><TableCell>{shipment.shipper?.username || "Chưa gán"}</TableCell><TableCell><select className="h-9 rounded border bg-white px-2 text-sm" value={shipment.shipper?._id || ""} onChange={(e) => void assign(shipment, e.target.value)}><option value="">Chọn shipper</option>{shippers.map((shipper) => <option key={shipper._id} value={shipper._id}>{shipper.username}</option>)}</select></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="icon" variant="outline" onClick={() => void showHistory(shipment._id)}><History className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="text-red-600" onClick={() => void cancel(shipment)} disabled={!['pending','picked_up'].includes(shipment.shippingStatus)}><XCircle className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Dialog open={Boolean(history)} onOpenChange={(open) => !open && setHistory(null)}><DialogContent><DialogHeader><DialogTitle>Lịch sử giao hàng</DialogTitle></DialogHeader><div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">{history?.length ? history.map((item, index) => <div key={index} className="border-b pb-3 text-sm"><p className="font-semibold text-slate-900">{historyStatusLabels[item.status] || item.status}</p><p className="mt-1 text-slate-700">{translateHistoryText(item.location || item.notes)}</p><p className="mt-1 text-xs text-slate-500">{item.timestamp ? new Date(item.timestamp).toLocaleString('vi-VN') : "--"}</p></div>) : <p>Chưa có lịch sử.</p>}</div></DialogContent></Dialog></>;
}
function Row({ text }: { text: string }) { return <TableRow><TableCell colSpan={5} className="py-8 text-center">{text}</TableCell></TableRow>; }
