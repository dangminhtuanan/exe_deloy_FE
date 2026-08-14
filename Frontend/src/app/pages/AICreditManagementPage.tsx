import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Coins, RefreshCcw, Search, UserPlus } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { aiPackageApi, getErrorMessage, usersApi } from "../lib/api";
import type { AITransaction, Pagination, UserProfile } from "../types";

const PAGE_SIZE = 10;

function dateTime(value?: string) {
  return value ? new Date(value).toLocaleString("vi-VN") : "--";
}

function money(value?: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value || 0);
}

function statusVariant(status: AITransaction["status"]) {
  return status === "PAID" ? "default" : status === "PENDING" ? "secondary" : "destructive";
}

export function AICreditManagementContent() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<AITransaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [grantOpen, setGrantOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ userId: "", credits: "", reason: "" });

  const loadData = async (targetPage = page) => {
    setLoading(true);
    try {
      const [transactionResponse, userResponse] = await Promise.all([
        aiPackageApi.getAllTransactions({ page: targetPage, limit: PAGE_SIZE }),
        usersApi.getAll({ page: 1, limit: 200 }),
      ]);
      setTransactions(transactionResponse.transactions);
      setPagination(transactionResponse.pagination ?? null);
      setUsers(userResponse.users);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(page);
  }, [page]);

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return transactions;
    return transactions.filter((transaction) => {
      const user = typeof transaction.user === "object" ? transaction.user : undefined;
      const aiPackage = typeof transaction.package === "object" ? transaction.package : undefined;
      return [transaction._id, transaction.status, transaction.orderCode, user?.username, user?.email, aiPackage?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [search, transactions]);

  const paidTransactions = transactions.filter((item) => item.status === "PAID");
  const totalCreditsSold = paidTransactions.reduce((total, item) => total + item.credits, 0);
  const totalRevenue = paidTransactions.reduce((total, item) => total + item.amount, 0);

  const submitGrant = async (event: React.FormEvent) => {
    event.preventDefault();
    const credits = Number(form.credits);
    if (!form.userId || !Number.isSafeInteger(credits) || credits <= 0) {
      toast.error("Hãy chọn người dùng và nhập số credit nguyên dương.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await aiPackageApi.addCredits({
        userId: form.userId,
        credits,
        reason: form.reason.trim() || undefined,
      });
      toast.success(`Đã cộng ${result.creditsAdded} credit. Số dư mới: ${result.newBalance}.`);
      setGrantOpen(false);
      setForm({ userId: "", credits: "", reason: "" });
      if (page === 1) await loadData(1);
      else setPage(1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="icon" onClick={() => navigate("/admin")} title="Về trang quản trị">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Quản lý credit AI</h1>
              <p className="text-sm text-slate-500">Theo dõi các gói credit người dùng đã mua và cộng credit thủ công.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadData(page)} disabled={loading}><RefreshCcw className="h-4 w-4" /> Làm mới</Button>
            <Button onClick={() => setGrantOpen(true)}><UserPlus className="h-4 w-4" /> Cộng credit</Button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <Metric title="Giao dịch đã thanh toán" value={paidTransactions.length} />
          <Metric title="Credit đã bán" value={totalCreditsSold} icon={<Coins className="h-5 w-5" />} />
          <Metric title="Doanh thu credit AI" value={money(totalRevenue)} />
        </section>

        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Lịch sử mua credit AI</CardTitle>
              <CardDescription>Hiển thị tối đa {PAGE_SIZE} giao dịch mới nhất.</CardDescription>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Tìm tên, email, gói..." />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Gói AI</TableHead><TableHead>Credit</TableHead><TableHead>Thanh toán</TableHead><TableHead>Trạng thái</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-500">Đang tải...</TableCell></TableRow> : filteredTransactions.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-slate-500">Chưa có giao dịch phù hợp.</TableCell></TableRow> : filteredTransactions.map((transaction) => {
                  const transactionUser = typeof transaction.user === "object" ? transaction.user : undefined;
                  const aiPackage = typeof transaction.package === "object" ? transaction.package : undefined;
                  return <TableRow key={transaction._id}><TableCell><p className="font-medium">{transactionUser?.username || "--"}</p><p className="text-xs text-slate-500">{transactionUser?.email || "--"}</p></TableCell><TableCell>{aiPackage?.name || "Gói đã xóa"}</TableCell><TableCell className="font-semibold">{transaction.credits}</TableCell><TableCell>{money(transaction.amount)}</TableCell><TableCell><Badge variant={statusVariant(transaction.status)}>{transaction.status}</Badge></TableCell><TableCell>{dateTime(transaction.paidAt || transaction.createdAt)}</TableCell></TableRow>;
                })}
              </TableBody>
              </Table>
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col gap-2 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  Trang {page} / {pagination.totalPages} · Tổng {pagination.total} mục
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Trước
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}>
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cộng credit AI thủ công</DialogTitle><DialogDescription>Credit được cộng vào ví credit đã mua và không bị reset hằng tháng.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={submitGrant}>
            <div className="space-y-2"><Label htmlFor="credit-user">Người dùng</Label><select id="credit-user" className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.userId} onChange={(event) => setForm({ ...form, userId: event.target.value })} required><option value="">Chọn người dùng</option>{users.map((item) => <option key={item._id} value={item._id}>{item.username} · {item.email} · {item.paidAiCredits || 0} credit mua</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="credit-amount">Số credit cộng</Label><Input id="credit-amount" type="number" min="1" step="1" value={form.credits} onChange={(event) => setForm({ ...form, credits: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="credit-reason">Lý do (tuỳ chọn)</Label><Textarea id="credit-reason" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Ví dụ: Bù credit do lỗi thanh toán" /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setGrantOpen(false)}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? "Đang cộng..." : "Cộng credit"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Metric({ title, value, icon }: { title: string; value: string | number; icon?: ReactNode }) {
  return <Card><CardHeader className="flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle>{icon}</CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}
