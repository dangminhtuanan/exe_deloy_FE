import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { aiApi, getErrorMessage, type AIBehaviorLog, type ChatbotLog } from "../lib/api";
import type { Pagination } from "../types";

const dateTime = (value?: string) => value ? new Date(value).toLocaleString("vi-VN") : "--";

export function AdminAILogsContent() {
  const [behaviorLogs, setBehaviorLogs] = useState<AIBehaviorLog[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatbotLog[]>([]);
  const [behaviorPagination, setBehaviorPagination] = useState<Pagination | null>(null);
  const [chatPagination, setChatPagination] = useState<Pagination | null>(null);
  const [behaviorPage, setBehaviorPage] = useState(1);
  const [chatPage, setChatPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [behavior, chat] = await Promise.all([
        aiApi.getBehaviorLogs({ page: behaviorPage, limit: 10 }),
        aiApi.getChatbotLogs({ page: chatPage, limit: 10 }),
      ]);
      setBehaviorLogs(behavior.logs); setChatLogs(chat.logs);
      setBehaviorPagination(behavior.pagination || null); setChatPagination(chat.pagination || null);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [behaviorPage, chatPage]);
  const keyword = search.trim().toLowerCase();
  const behavior = useMemo(() => behaviorLogs.filter((log) => !keyword || [log.action, log.keyword, log.user?.username, log.user?.email, log.product?.name].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))), [behaviorLogs, keyword]);
  const chats = useMemo(() => chatLogs.filter((log) => !keyword || [log.question, log.answer, log.intent, log.user?.username, log.user?.email].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))), [chatLogs, keyword]);

  return <div className="space-y-6">
    <Card><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Nhật ký AI</CardTitle><CardDescription>Hành vi của người dùng và lịch sử chatbot.</CardDescription></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="w-72 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm log..." /></div><Button variant="outline" size="icon" onClick={() => void load()}><RefreshCcw className="h-4 w-4" /></Button></div></CardHeader></Card>
    <Card><CardHeader><CardTitle className="text-base">Hành vi AI</CardTitle><CardDescription>{behaviorPagination?.total ?? behavior.length} bản ghi</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Hành động</TableHead><TableHead>Sản phẩm / từ khóa</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader><TableBody>{loading ? <Row text="Đang tải..." /> : behavior.length === 0 ? <Row text="Chưa có dữ liệu." /> : behavior.map((log) => <TableRow key={log._id}><TableCell><p className="font-medium">{log.user?.username || "Khách"}</p><p className="text-xs text-slate-500">{log.user?.email || "--"}</p></TableCell><TableCell>{log.action}</TableCell><TableCell>{log.product?.name || log.keyword || "--"}</TableCell><TableCell>{dateTime(log.createdAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent><Pager pagination={behaviorPagination} page={behaviorPage} onPageChange={setBehaviorPage} label="bản ghi" /></Card>
    <Card><CardHeader><CardTitle className="text-base">Lịch sử chatbot</CardTitle><CardDescription>{chatPagination?.total ?? chats.length} hội thoại</CardDescription></CardHeader><CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Người dùng</TableHead><TableHead>Câu hỏi</TableHead><TableHead>Phản hồi</TableHead><TableHead>Thời gian</TableHead></TableRow></TableHeader><TableBody>{loading ? <Row text="Đang tải..." /> : chats.length === 0 ? <Row text="Chưa có dữ liệu." /> : chats.map((log) => <TableRow key={log._id}><TableCell>{log.user?.email || log.user?.username || "Khách"}</TableCell><TableCell className="max-w-64 truncate">{log.question}</TableCell><TableCell className="max-w-80 truncate">{log.answer || "--"}</TableCell><TableCell>{dateTime(log.createdAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent><Pager pagination={chatPagination} page={chatPage} onPageChange={setChatPage} label="hội thoại" /></Card>
  </div>;
}

function Pager({ pagination, page, onPageChange, label }: { pagination: Pagination | null; page: number; onPageChange: (value: number) => void; label: string }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-slate-600"><span>Trang {pagination.page}/{pagination.totalPages} · {pagination.total} {label}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trước</Button><Button size="sm" variant="outline" disabled={page >= pagination.totalPages} onClick={() => onPageChange(page + 1)}>Sau</Button></div></div>;
}
function Row({ text }: { text: string }) { return <TableRow><TableCell colSpan={4} className="py-8 text-center text-slate-500">{text}</TableCell></TableRow>; }
