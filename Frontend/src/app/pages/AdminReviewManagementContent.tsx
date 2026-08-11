import { useEffect, useState } from "react";
import { Eye, EyeOff, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { getErrorMessage, reviewsApi, type AdminReview } from "../lib/api";
import type { Pagination } from "../types";

export function AdminReviewManagementContent() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await reviewsApi.getAll({ page, limit: 10 });
      setReviews(response.reviews); setPagination(response.pagination || null);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [page]);
  const toggle = async (review: AdminReview) => { try { await reviewsApi.setVisibility(review._id, !review.isVisible); toast.success("Đã cập nhật hiển thị review"); await load(); } catch (error) { toast.error(getErrorMessage(error)); } };
  const remove = async (review: AdminReview) => { if (!window.confirm("Xóa vĩnh viễn review này?")) return; try { await reviewsApi.adminRemove(review._id); toast.success("Đã xóa review"); if (reviews.length === 1 && page > 1) setPage(page - 1); else await load(); } catch (error) { toast.error(getErrorMessage(error)); } };
  return <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Quản lý review</CardTitle><CardDescription>Duyệt, ẩn/hiện hoặc xóa đánh giá sản phẩm. {pagination?.total ?? reviews.length} review</CardDescription></div><Button variant="outline" size="icon" onClick={() => void load()}><RefreshCcw className="h-4 w-4" /></Button></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Sản phẩm</TableHead><TableHead>Đánh giá</TableHead><TableHead>Nội dung</TableHead><TableHead>Hiển thị</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>{loading ? <Row text="Đang tải..." /> : reviews.length === 0 ? <Row text="Chưa có review." /> : reviews.map((review) => <TableRow key={review._id}><TableCell>{review.user?.email || review.user?.username || "--"}</TableCell><TableCell>{review.product?.name || "--"}</TableCell><TableCell>{"★".repeat(review.rating)}</TableCell><TableCell className="max-w-80 truncate">{review.comment || "--"}</TableCell><TableCell><Badge variant={review.isVisible ? "default" : "secondary"}>{review.isVisible ? "Hiển thị" : "Đã ẩn"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="icon" variant="outline" onClick={() => void toggle(review)}>{review.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button><Button size="icon" variant="outline" className="text-red-600" onClick={() => void remove(review)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent><Pager pagination={pagination} page={page} onPageChange={setPage} /></Card>;
}
function Pager({ pagination, page, onPageChange }: { pagination: Pagination | null; page: number; onPageChange: (value: number) => void }) { if (!pagination || pagination.totalPages <= 1) return null; return <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-slate-600"><span>Trang {pagination.page}/{pagination.totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trước</Button><Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}>Sau</Button></div></div>; }
function Row({ text }: { text: string }) { return <TableRow><TableCell colSpan={6} className="py-8 text-center text-slate-500">{text}</TableCell></TableRow>; }
