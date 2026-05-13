import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, QrCode, Copy, Download, Printer } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import QRCode from "qrcode";
import { useListTables, getListTablesQueryKey, useCreateTable, useDeleteTable } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageLoader } from "@/components/LoadingSpinner";

const tableSchema = z.object({
  number: z.coerce.number().min(1, "Table number must be at least 1"),
  label: z.string().optional(),
});
type TableValues = z.infer<typeof tableSchema>;

function useQRDataUrl(url: string) {
  const [dataUrl, setDataUrl] = useState<string>("");
  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "H",
    }).then(setDataUrl).catch(() => setDataUrl(""));
  }, [url]);
  return dataUrl;
}

interface TableCardProps {
  table: {
    id: string;
    number: number;
    label?: string | null;
    qrCode: string;
  };
  onDelete: (id: string) => void;
  onPreview: (table: { id: string; number: number; label?: string | null; qrCode: string }) => void;
}

function TableCard({ table, onDelete, onPreview }: TableCardProps) {
  const { toast } = useToast();
  const qrUrl = `${window.location.origin}${table.qrCode}`;
  const dataUrl = useQRDataUrl(qrUrl);

  const copyUrl = () => {
    navigator.clipboard.writeText(qrUrl);
    toast({ title: "QR URL copied!" });
  };

  const downloadQR = () => {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `table-${table.number}-qr.png`;
    link.click();
  };

  return (
    <div
      className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm"
      data-testid={`card-table-${table.id}`}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-bold text-lg text-foreground">Table {table.number}</p>
          {table.label && <p className="text-xs text-muted-foreground">{table.label}</p>}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 hover:text-destructive"
          onClick={() => onDelete(table.id)}
          data-testid={`button-delete-table-${table.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 flex flex-col items-center gap-3">
        {dataUrl ? (
          <button
            onClick={() => onPreview(table)}
            className="rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-zoom-in"
            title="Click to enlarge"
            data-testid={`button-preview-qr-${table.id}`}
          >
            <img src={dataUrl} alt={`QR Code for Table ${table.number}`} className="w-32 h-32" />
          </button>
        ) : (
          <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}

        <p className="text-xs font-mono text-muted-foreground truncate max-w-full px-1" data-testid={`text-qr-${table.id}`}>
          {qrUrl}
        </p>

        <div className="flex gap-2 w-full">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs gap-1"
            onClick={copyUrl}
            data-testid={`button-copy-qr-${table.id}`}
          >
            <Copy className="h-3 w-3" /> Copy URL
          </Button>
          <Button
            size="sm"
            className="flex-1 h-8 text-xs gap-1"
            onClick={downloadQR}
            disabled={!dataUrl}
            data-testid={`button-download-qr-${table.id}`}
          >
            <Download className="h-3 w-3" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}

interface QRPreviewDialogProps {
  table: { id: string; number: number; label?: string | null; qrCode: string } | null;
  onClose: () => void;
}

function QRPreviewDialog({ table, onClose }: QRPreviewDialogProps) {
  const { toast } = useToast();
  const qrUrl = table ? `${window.location.origin}${table.qrCode}` : "";
  const dataUrl = useQRDataUrl(qrUrl);
  const printRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    if (!dataUrl || !table) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `table-${table.number}-qr.png`;
    link.click();
  };

  const copyUrl = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    toast({ title: "URL copied!" });
  };

  const printQR = () => {
    if (!printRef.current || !dataUrl || !table) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Table ${table.number} QR Code</title>
      <style>
        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif; }
        .card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 32px; text-align: center; max-width: 320px; }
        img { width: 240px; height: 240px; }
        h1 { font-size: 28px; font-weight: bold; margin: 16px 0 4px; color: #111; }
        p { font-size: 13px; color: #6b7280; margin: 0 0 8px; }
        .brand { font-size: 18px; font-weight: 600; color: #c41230; margin-top: 16px; }
      </style></head>
      <body>
        <div class="card">
          <img src="${dataUrl}" alt="QR Code" />
          <h1>Table ${table.number}</h1>
          ${table.label ? `<p>${table.label}</p>` : ""}
          <p style="font-size:11px;color:#9ca3af;word-break:break-all">${qrUrl}</p>
          <p class="brand">Tasty Point</p>
        </div>
      </body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <Dialog open={!!table} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Table {table?.number} QR Code
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="flex flex-col items-center gap-4 py-2">
          {dataUrl ? (
            <div className="rounded-xl border-2 border-border p-3 bg-white">
              <img src={dataUrl} alt={`QR Table ${table?.number}`} className="w-56 h-56" />
            </div>
          ) : (
            <div className="w-56 h-56 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}

          {table?.label && <p className="text-sm text-muted-foreground font-medium">{table.label}</p>}

          <div className="w-full bg-muted rounded-lg px-3 py-2">
            <p className="text-xs font-mono text-muted-foreground break-all text-center">{qrUrl}</p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-1" onClick={copyUrl}>
              <Copy className="h-4 w-4" /> Copy URL
            </Button>
            <Button variant="outline" className="flex-1 gap-1" onClick={printQR} disabled={!dataUrl}>
              <Printer className="h-4 w-4" /> Print
            </Button>
          </div>
          <Button className="w-full gap-2" onClick={downloadQR} disabled={!dataUrl} data-testid="button-download-qr-dialog">
            <Download className="h-4 w-4" /> Download PNG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminTablesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewTable, setPreviewTable] = useState<{ id: string; number: number; label?: string | null; qrCode: string } | null>(null);

  const { data: tables, isLoading } = useListTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const form = useForm<TableValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { number: 1, label: "" },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListTablesQueryKey() });

  const onSubmit = (values: TableValues) => {
    createTable.mutate(
      { data: { number: values.number, label: values.label || undefined } },
      {
        onSuccess: () => {
          invalidate();
          setDialogOpen(false);
          form.reset();
          toast({ title: "Table created" });
        },
        onError: () => toast({ title: "Failed to create table", variant: "destructive" }),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteTable.mutate({ id }, { onSuccess: invalidate });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="text-sm text-muted-foreground">
            {(tables ?? []).length} table{(tables ?? []).length !== 1 ? "s" : ""} — click any QR to enlarge, print, or download
          </p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-new-table">
          <Plus className="h-4 w-4 mr-1" /> Add Table
        </Button>
      </div>

      {(tables ?? []).length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <QrCode className="h-14 w-14 text-muted-foreground/30 mx-auto" />
          <p className="font-semibold text-muted-foreground">No tables yet</p>
          <p className="text-sm text-muted-foreground">Add a table to generate its QR code</p>
          <Button onClick={() => setDialogOpen(true)} className="mt-2">
            <Plus className="h-4 w-4 mr-1" /> Add First Table
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tables ?? []).map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onDelete={handleDelete}
              onPreview={setPreviewTable}
            />
          ))}
        </div>
      )}

      <QRPreviewDialog table={previewTable} onClose={() => setPreviewTable(null)} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Number</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} data-testid="input-table-number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Label <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Window seat, Outdoor..." data-testid="input-table-label" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTable.isPending} data-testid="button-save-table">
                  {createTable.isPending ? "Creating..." : "Create Table"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
