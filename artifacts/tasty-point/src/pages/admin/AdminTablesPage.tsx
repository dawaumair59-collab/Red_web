import { useState } from "react";
import {
  Plus, QrCode, Download, Copy, Printer, Trash2, Pencil,
  Check, ExternalLink, Table2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListTables, useCreateTable, useDeleteTable, getListTablesQueryKey,
} from "@workspace/api-client-react";
import type { Table } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/LoadingSpinner";

function getMenuUrl(table: Table): string {
  const path = table.qrCode.startsWith("/tasty-point")
    ? table.qrCode
    : `/tasty-point${table.qrCode}`;
  return `${window.location.origin}${path}`;
}

function useQRCode(url: string) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [url]);
  return dataUrl;
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Copy menu link"
      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/50 hover:bg-accent border border-border transition-colors group w-full"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ opacity: 0 }}>
            <Check className="h-4 w-4 text-green-600" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Copy className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </motion.span>
        )}
      </AnimatePresence>
      <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
        {copied ? "Copied!" : "Copy Link"}
      </span>
    </button>
  );
}

interface TableCardProps {
  table: Table;
  onEdit: (table: Table) => void;
  onDelete: (table: Table) => void;
}

function TableCard({ table, onEdit, onDelete }: TableCardProps) {
  const menuUrl = getMenuUrl(table);
  const qrDataUrl = useQRCode(menuUrl);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `table-${table.number}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    if (!qrDataUrl) return;
    const win = window.open("", "_blank", "width=600,height=750");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Table ${table.number} QR</title>
  <style>
    body{margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:system-ui,sans-serif}
    .wrap{text-align:center;padding:40px}
    .qr{width:260px;height:260px;border:2px solid #e5e7eb;border-radius:12px;padding:12px}
    .num{font-size:32px;font-weight:900;margin:16px 0 4px;color:#111}
    .lbl{font-size:14px;color:#6b7280;margin-bottom:8px}
    .url{font-size:9px;color:#9ca3af;word-break:break-all;max-width:280px;margin-top:8px}
    .badge{display:inline-block;background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:99px;margin-bottom:12px}
  </style>
</head>
<body onload="window.print()">
  <div class="wrap">
    <div class="badge">Tasty Point</div><br/>
    <img class="qr" src="${qrDataUrl}" />
    <div class="num">Table ${table.number}</div>
    ${table.label ? `<div class="lbl">${table.label}</div>` : ""}
    <div class="url">${menuUrl}</div>
  </div>
</body>
</html>`);
    win.document.close();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
    >
      {/* Header stripe */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-red-600 to-red-700">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
            <span className="text-white font-black text-base leading-none">{table.number}</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Table {table.number}</p>
            {table.label
              ? <p className="text-red-200 text-xs font-medium">{table.label}</p>
              : <p className="text-red-300 text-xs italic">No label</p>
            }
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(table)}
            className="h-8 w-8 rounded-lg bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors" title="Edit label">
            <Pencil className="h-3.5 w-3.5 text-white" />
          </button>
          <button onClick={() => onDelete(table)}
            className="h-8 w-8 rounded-lg bg-white/15 hover:bg-red-900/60 flex items-center justify-center transition-colors" title="Delete table">
            <Trash2 className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>

      {/* QR section */}
      <div className="flex flex-col items-center px-5 pt-5 pb-4 gap-4">
        {/* QR image */}
        <div className="relative">
          {qrDataUrl ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-border p-2 bg-white shadow-inner w-44 h-44">
              <img src={qrDataUrl} alt={`QR Table ${table.number}`} className="w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-8 w-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow">
                  <QrCode className="h-4 w-4 text-gray-700" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-2">
              <QrCode className="h-8 w-8 text-muted-foreground opacity-25" />
              <p className="text-xs text-muted-foreground">Generating…</p>
            </div>
          )}
        </div>

        {/* URL chip */}
        <div className="w-full bg-muted/40 rounded-xl px-3 py-2 flex items-center gap-2 min-w-0 border border-border/60">
          <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground font-mono truncate flex-1">{menuUrl}</p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 w-full">
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/50 hover:bg-accent border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
            title="Download QR as PNG"
          >
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Download</span>
          </button>

          <CopyLinkButton url={menuUrl} />

          <button
            onClick={handlePrint}
            disabled={!qrDataUrl}
            className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-muted/50 hover:bg-accent border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed group"
            title="Print QR code"
          >
            <Printer className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Print</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {new Date(table.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 font-bold text-green-700 border-green-300 bg-green-50">
          ● Active
        </Badge>
      </div>
    </motion.div>
  );
}

export default function AdminTablesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: tables = [], isLoading } = useListTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ number: "", label: "" });
  const [saving, setSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListTablesQueryKey() });

  const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;

  const handleAdd = async () => {
    const num = parseInt(form.number);
    if (isNaN(num) || num < 1 || num > 999) {
      toast({ title: "Enter a valid table number (1–999)", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createTable.mutateAsync({ data: { number: num, label: form.label.trim() || undefined } });
      invalidate();
      setAddOpen(false);
      setForm({ number: "", label: "" });
      toast({ title: `Table ${num} created ✓` });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Failed to create table";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (table: Table) => {
    if (!confirm(`Delete Table ${table.number}? The QR code will stop working.`)) return;
    try {
      await deleteTable.mutateAsync({ id: table.id });
      invalidate();
      toast({ title: `Table ${table.number} deleted` });
    } catch {
      toast({ title: "Failed to delete table", variant: "destructive" });
    }
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    setEditLabel(table.label ?? "");
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingTable) return;
    setEditSaving(true);
    try {
      const basePath = (import.meta.env.BASE_URL ?? "/tasty-point/").replace(/\/$/, "");
      await fetch(`${basePath}/api/tables/${editingTable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editLabel.trim() || null }),
      });
      invalidate();
      setEditOpen(false);
      toast({ title: "Table label updated" });
    } catch {
      toast({ title: "Failed to update table", variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Table Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tables.length} table{tables.length !== 1 ? "s" : ""} · QR codes for instant ordering
          </p>
        </div>
        <Button
          onClick={() => { setForm({ number: String(nextNum), label: "" }); setAddOpen(true); }}
          className="bg-red-600 hover:bg-red-700 text-white gap-2 sm:self-auto self-start shadow-md shadow-red-200"
          data-testid="button-add-table"
        >
          <Plus className="h-4 w-4" /> Add Table
        </Button>
      </div>

      {/* How-it-works banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <QrCode className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-bold">How it works:</span> Each table gets a unique QR code.
          Customers scan → menu opens → they order → you see <em>"Order from Table X"</em> in the kitchen.
        </p>
      </div>

      {/* Empty state */}
      {tables.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-28 gap-4"
        >
          <div className="h-20 w-20 rounded-3xl bg-muted/50 border-2 border-dashed border-border flex items-center justify-center">
            <Table2 className="h-9 w-9 text-muted-foreground opacity-30" />
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground text-lg">No tables yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Add your restaurant tables to generate QR codes for each one
            </p>
          </div>
          <Button
            onClick={() => { setForm({ number: "1", label: "" }); setAddOpen(true); }}
            className="bg-red-600 hover:bg-red-700 text-white mt-2"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Your First Table
          </Button>
        </motion.div>
      )}

      {/* Table cards grid */}
      {tables.length > 0 && (
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {tables.map((table) => (
              <TableCard key={table.id} table={table} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add Table Dialog ──────────────────────────────────────── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-red-100 flex items-center justify-center">
                <QrCode className="h-4 w-4 text-red-600" />
              </div>
              Add New Table
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Table Number <span className="text-red-500">*</span></label>
              <Input
                type="number"
                min="1"
                max="999"
                placeholder="e.g. 1, 2, 3…"
                value={form.number}
                onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <p className="text-xs text-muted-foreground">A unique QR code will be automatically generated</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                Label <span className="text-muted-foreground font-normal text-xs">(optional)</span>
              </label>
              <Input
                placeholder="e.g. Window Seat, Rooftop, VIP…"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>

            {form.number && !isNaN(parseInt(form.number)) && (
              <div className="bg-muted/50 border border-border rounded-xl px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">QR will link to</p>
                <p className="text-[11px] text-foreground font-mono break-all">
                  {window.location.origin}/tasty-point/menu?tableId=&lt;unique-id&gt;
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={handleAdd}
              disabled={saving || !form.number.trim()}
              className="bg-red-600 hover:bg-red-700 text-white min-w-[140px]"
              data-testid="button-confirm-add-table"
            >
              {saving ? "Creating…" : "Create & Generate QR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Table Dialog ─────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Edit Table {editingTable?.number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Table Label</label>
              <Input
                placeholder="e.g. Window Seat, Patio, VIP…"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
              />
              <p className="text-xs text-muted-foreground">
                The QR code stays the same — only the display label changes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {editSaving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
