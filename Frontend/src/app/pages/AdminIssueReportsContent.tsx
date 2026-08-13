import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Textarea } from "../components/ui/textarea";
import { getErrorMessage, issueReportsApi, type IssueReport, type IssueReportStatus } from "../lib/api";

const labels: Record<IssueReportStatus, string> = { new: "Mới", in_progress: "Đang xử lý", resolved: "Đã giải quyết", rejected: "Từ chối" };

export function AdminIssueReportsContent() {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | IssueReportStatus>("all");

  const load = async () => {
    setLoading(true);
    try {
      const response = await issueReportsApi.getAll({ limit: 100, ...(filter === "all" ? {} : { status: filter }) });
      setReports(response.reports);
      setNotes(Object.fromEntries(response.reports.map((item) => [item._id, item.adminNote || ""])));
    } catch (error) { toast.error(getErrorMessage(error)); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [filter]);

  const update = async (report: IssueReport, status: IssueReportStatus) => {
    setSavingId(report._id);
    try {
      const response = await issueReportsApi.update(report._id, { status, adminNote: notes[report._id] || "" });
      setReports((current) => current.map((item) => item._id === report._id ? response.report : item));
      toast.success("Đã cập nhật báo cáo");
    } catch (error) { toast.error(getErrorMessage(error)); } finally { setSavingId(""); }
  };

  return <div className="space-y-4">
    <Card><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Báo cáo sự cố</CardTitle><CardDescription>Tiếp nhận và phản hồi sự cố do người dùng gửi.</CardDescription></div><div className="flex gap-2"><select className="h-9 rounded-md border bg-white px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)}><option value="all">Tất cả</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button variant="outline" size="sm" onClick={() => void load()}>Làm mới</Button></div></CardHeader></Card>
    {loading ? <Card><CardContent className="py-10 text-center text-gray-500">Đang tải báo cáo...</CardContent></Card> : reports.length === 0 ? <Card><CardContent className="py-10 text-center text-gray-500">Không có báo cáo phù hợp.</CardContent></Card> : reports.map((report) => {
      const user = typeof report.user === "object" ? report.user : undefined;
      return <Card key={report._id}><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="text-base">{report.subject}</CardTitle><CardDescription className="mt-1">{user?.username || "Người dùng"} · {user?.email || "--"} · {report.createdAt ? new Date(report.createdAt).toLocaleString("vi-VN") : "--"}</CardDescription></div><span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{labels[report.status]}</span></div></CardHeader><CardContent className="space-y-4"><p className="whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-sm text-gray-700">{report.description}</p><Textarea value={notes[report._id] || ""} onChange={(e) => setNotes((current) => ({ ...current, [report._id]: e.target.value }))} placeholder="Nhập phản hồi cho người dùng..." maxLength={1000} /><div className="flex flex-wrap gap-2">{(["in_progress", "resolved", "rejected"] as IssueReportStatus[]).map((status) => <Button key={status} size="sm" variant={status === "resolved" ? "default" : "outline"} disabled={savingId === report._id} onClick={() => void update(report, status)}>{labels[status]}</Button>)}</div></CardContent></Card>;
    })}
  </div>;
}
