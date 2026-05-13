import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useListCategories, getListCategoriesQueryKey,
  useCreateCategory, useUpdateCategory, useDeleteCategory,
  useListMenuItems, getListMenuItemsQueryKey,
  useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/LoadingSpinner";

const itemSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  categoryId: z.string().min(1, "Category required"),
  imageUrl: z.string().nullable().optional(),
  available: z.boolean(),
  isVeg: z.boolean(),
  isFeatured: z.boolean(),
});
type ItemValues = z.infer<typeof itemSchema>;

const categorySchema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().min(1, "Slug required"),
  imageUrl: z.string().nullable().optional(),
  sortOrder: z.coerce.number().default(0),
});
type CategoryValues = z.infer<typeof categorySchema>;

export default function AdminMenuPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [itemDialog, setItemDialog] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [catDialog, setCatDialog] = useState<{ open: boolean; editId?: string }>({ open: false });
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: allItems, isLoading: itemsLoading } = useListMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const itemForm = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: "", description: "", price: 0, categoryId: "", imageUrl: null, available: true, isVeg: true, isFeatured: false },
  });

  const catForm = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", imageUrl: null, sortOrder: 0 },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey() });
    qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  };

  const openNewItem = (categoryId?: string) => {
    itemForm.reset({ name: "", description: "", price: 0, categoryId: categoryId ?? "", imageUrl: null, available: true, isVeg: true, isFeatured: false });
    setItemDialog({ open: true });
  };

  const openEditItem = (item: { id: string; name?: string | null; description?: string | null; price?: number | null; categoryId?: string | null; imageUrl?: string | null; available?: boolean | null; isVeg?: boolean | null; isFeatured?: boolean | null }) => {
    itemForm.reset({ name: item.name ?? "", description: item.description ?? "", price: item.price ?? 0, categoryId: item.categoryId ?? "", imageUrl: item.imageUrl ?? null, available: item.available ?? true, isVeg: item.isVeg ?? true, isFeatured: item.isFeatured ?? false });
    setItemDialog({ open: true, editId: item.id });
  };

  const onSubmitItem = (values: ItemValues) => {
    const data = { ...values, imageUrl: values.imageUrl ?? undefined };
    if (itemDialog.editId) {
      updateItem.mutate({ id: itemDialog.editId, data }, { onSuccess: () => { invalidate(); setItemDialog({ open: false }); toast({ title: "Item updated" }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) });
    } else {
      createItem.mutate({ data }, { onSuccess: () => { invalidate(); setItemDialog({ open: false }); toast({ title: "Item created" }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) });
    }
  };

  const onSubmitCat = (values: CategoryValues) => {
    const data = { ...values, imageUrl: values.imageUrl ?? undefined };
    if (catDialog.editId) {
      updateCat.mutate({ id: catDialog.editId, data }, { onSuccess: () => { invalidate(); setCatDialog({ open: false }); toast({ title: "Category updated" }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) });
    } else {
      createCat.mutate({ data }, { onSuccess: () => { invalidate(); setCatDialog({ open: false }); toast({ title: "Category created" }); }, onError: () => toast({ title: "Failed", variant: "destructive" }) });
    }
  };

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (catsLoading || itemsLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu</h1>
          <p className="text-sm text-muted-foreground">Manage categories and items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { catForm.reset(); setCatDialog({ open: true }); }} data-testid="button-new-category">
            <Plus className="h-4 w-4 mr-1" /> Category
          </Button>
          <Button size="sm" onClick={() => openNewItem()} data-testid="button-new-item">
            <Plus className="h-4 w-4 mr-1" /> Item
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {(categories ?? []).map((cat) => {
          const catItems = (allItems ?? []).filter((i) => i.categoryId === cat.id);
          const expanded = expandedCats.has(cat.id);
          return (
            <div key={cat.id} className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 flex items-center justify-between">
                <button className="flex items-center gap-2 flex-1 text-left" onClick={() => toggleCat(cat.id)} data-testid={`button-toggle-cat-${cat.id}`}>
                  {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-semibold">{cat.name}</span>
                  <Badge variant="secondary" className="text-xs">{catItems.length} items</Badge>
                </button>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openNewItem(cat.id)} data-testid={`button-add-item-to-${cat.id}`}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { catForm.reset(cat); setCatDialog({ open: true, editId: cat.id }); }} data-testid={`button-edit-cat-${cat.id}`}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => deleteCat.mutate({ id: cat.id }, { onSuccess: invalidate })} data-testid={`button-delete-cat-${cat.id}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {expanded && (
                <>
                  <Separator />
                  <div className="divide-y divide-border">
                    {catItems.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted-foreground">No items. Add one above.</p>
                    ) : (
                      catItems.map((item) => (
                        <div key={item.id} className="px-4 py-3 flex items-center gap-3" data-testid={`row-item-${item.id}`}>
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{item.name}</p>
                              {!item.available && <Badge variant="outline" className="text-xs">Unavailable</Badge>}
                              {item.isFeatured && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Featured</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.isVeg ? "Veg" : "Non-veg"} · ₹{item.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditItem(item)} data-testid={`button-edit-item-${item.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => deleteItem.mutate({ id: item.id }, { onSuccess: invalidate })} data-testid={`button-delete-item-${item.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={(v) => !v && setItemDialog({ open: false })}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{itemDialog.editId ? "Edit Item" : "New Item"}</DialogTitle>
          </DialogHeader>
          <Form {...itemForm}>
            <form onSubmit={itemForm.handleSubmit(onSubmitItem)} className="space-y-4">
              <FormField control={itemForm.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={itemForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Butter Chicken" data-testid="input-item-name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={itemForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="A rich creamy curry..." rows={2} data-testid="input-item-desc" {...field} /></FormControl>
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={itemForm.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₹)</FormLabel>
                    <FormControl><Input type="number" step="0.01" data-testid="input-item-price" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={itemForm.control} name="categoryId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-item-category">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <FormField control={itemForm.control} name="available" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Available</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-available" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={itemForm.control} name="isVeg" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Veg</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-veg" /></FormControl>
                  </FormItem>
                )} />
                <FormField control={itemForm.control} name="isFeatured" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Featured</FormLabel>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-featured" /></FormControl>
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setItemDialog({ open: false })}>Cancel</Button>
                <Button type="submit" disabled={createItem.isPending || updateItem.isPending} data-testid="button-save-item">
                  {itemDialog.editId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialog.open} onOpenChange={(v) => !v && setCatDialog({ open: false })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{catDialog.editId ? "Edit Category" : "New Category"}</DialogTitle>
          </DialogHeader>
          <Form {...catForm}>
            <form onSubmit={catForm.handleSubmit(onSubmitCat)} className="space-y-4">
              <FormField control={catForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Starters" data-testid="input-cat-name" {...field} onChange={(e) => { field.onChange(e); catForm.setValue("slug", e.target.value.toLowerCase().replace(/\s+/g, "-")); }} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={catForm.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl><Input placeholder="starters" data-testid="input-cat-slug" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={catForm.control} name="sortOrder" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl><Input type="number" data-testid="input-cat-sort" {...field} /></FormControl>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCatDialog({ open: false })}>Cancel</Button>
                <Button type="submit" disabled={createCat.isPending || updateCat.isPending} data-testid="button-save-cat">
                  {catDialog.editId ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
