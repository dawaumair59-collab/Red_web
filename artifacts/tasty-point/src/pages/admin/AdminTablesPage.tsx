import { useState } from "react";
import { Plus, Trash2, QrCode, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

export default function AdminTablesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: tables, isLoading } = useListTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();

  const form = useForm<TableValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { number: 1, label: "" },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: getListTablesQueryKey() });

  const getQRUrl = (qrCode: string) => {
    const base = window.location.origin;
    return `${base}${qrCode}`;
  };

  const copyQR = (qrCode: string) => {
    navigator.clipboard.writeText(getQRUrl(qrCode));
    toast({ title: "QR URL copied to clipboard" });
  };

  const onSubmit = (values: TableValues) => {
    createTable.mutate(
      { data: { number: values.number, label: values.label || undefined } },
      {
        onSuccess: () => { invalidate(); setDialogOpen(false); form.reset(); toast({ title: "Table created" }); },
        onError: () => toast({ title: "Failed to create table", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tables</h1>
          <p className="text-sm text-muted-foreground">Manage tables and QR codes</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)} data-testid="button-new-table">
          <Plus className="h-4 w-4 mr-1" /> Add Table
        </Button>
      </div>

      {(tables ?? []).length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <QrCode className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground">No tables yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(tables ?? []).map((table) => (
            <div key={table.id} className="bg-card border border-card-border rounded-xl p-4 shadow-sm space-y-3" data-testid={`card-table-${table.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-2xl font-bold text-foreground">Table {table.number}</p>
                  {table.label && <p className="text-sm text-muted-foreground">{table.label}</p>}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:text-destructive"
                  onClick={() => deleteTable.mutate({ id: table.id }, { onSuccess: invalidate })}
                  data-testid={`button-delete-table-${table.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="bg-muted rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <QrCode className="h-3 w-3" />
                  <span>QR URL</span>
                </div>
                <p className="text-xs font-mono truncate text-foreground" data-testid={`text-qr-${table.id}`}>
                  {getQRUrl(table.qrCode)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1"
                  onClick={() => copyQR(table.qrCode)}
                  data-testid={`button-copy-qr-${table.id}`}
                >
                  <Copy className="h-3 w-3" /> Copy QR URL
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Table Number</FormLabel>
                  <FormControl><Input type="number" min={1} data-testid="input-table-number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="label" render={({ field }) => (
                <FormItem>
                  <FormLabel>Label (optional)</FormLabel>
                  <FormControl><Input placeholder="Window seat, outdoor..." data-testid="input-table-label" {...field} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTable.isPending} data-testid="button-save-table">
                  Create Table
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
