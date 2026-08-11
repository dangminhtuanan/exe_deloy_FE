import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Textarea } from "../components/ui/textarea";
import { categoriesApi, getErrorMessage } from "../lib/api";
import type { Category } from "../types";

const emptyForm = { name: "", slug: "", description: "", parent: "" };

export function AdminCategoryManagementContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await categoriesApi.getAll({ page: 1, limit: 200 });
      setCategories(response.categories);
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const showCreate = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const showEdit = (category: Category) => {
    setEditing(category);
    setForm({ name: category.name, slug: category.slug, description: category.description || "", parent: category.parent?._id || "" });
    setOpen(true);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true);
    try {
      const payload = { name: form.name.trim(), slug: form.slug.trim() || undefined, description: form.description.trim(), parent: form.parent || null };
      if (editing) await categoriesApi.update(editing._id, payload); else await categoriesApi.create(payload);
      toast.success(editing ? "Đã cập nhật danh mục" : "Đã tạo danh mục"); setOpen(false); await load();
    } catch (error) { toast.error(getErrorMessage(error)); }
    finally { setSubmitting(false); }
  };
  const remove = async (category: Category) => {
    if (!window.confirm(`Ẩn danh mục “${category.name}”?`)) return;
    try { await categoriesApi.remove(category._id); toast.success("Đã ẩn danh mục"); await load(); }
    catch (error) { toast.error(getErrorMessage(error)); }
  };

  return <>
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div><CardTitle>Quản lý danh mục</CardTitle><CardDescription>Tạo, cập nhật hoặc ẩn danh mục sản phẩm.</CardDescription></div>
        <div className="flex gap-2"><Button variant="outline" size="icon" onClick={() => void load()}><RefreshCcw className="h-4 w-4" /></Button><Button onClick={showCreate}><Plus className="h-4 w-4" /> Thêm danh mục</Button></div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0"><Table><TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Slug</TableHead><TableHead>Danh mục cha</TableHead><TableHead>Mô tả</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={5} className="py-10 text-center">Đang tải...</TableCell></TableRow> : categories.length === 0 ? <TableRow><TableCell colSpan={5} className="py-10 text-center">Chưa có danh mục.</TableCell></TableRow> : categories.map((category) => <TableRow key={category._id}><TableCell className="font-medium">{category.name}</TableCell><TableCell>{category.slug}</TableCell><TableCell>{category.parent?.name || "--"}</TableCell><TableCell className="max-w-80 truncate">{category.description || "--"}</TableCell><TableCell><div className="flex justify-end gap-2"><Button size="icon" variant="outline" onClick={() => showEdit(category)}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="outline" className="text-red-600" onClick={() => void remove(category)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}
      </TableBody></Table></CardContent>
    </Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Cập nhật danh mục" : "Thêm danh mục"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2"><Label htmlFor="category-name">Tên</Label><Input id="category-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label htmlFor="category-slug">Slug (để trống tự tạo)</Label><Input id="category-slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="category-parent">Danh mục cha</Label><select id="category-parent" className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}><option value="">Không có</option>{categories.filter((item) => item._id !== editing?._id).map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="category-description">Mô tả</Label><Textarea id="category-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={submitting}>{submitting ? "Đang lưu..." : "Lưu"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </>;
}
