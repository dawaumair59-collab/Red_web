import { useState } from "react";
import {
  Plus, Pencil, Trash2, Leaf, Drumstick, Star, Eye, EyeOff,
  ChevronDown, ChevronUp, FolderOpen, Search, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListCategories, useListMenuItems, useCreateCategory, useDeleteCategory,
  useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  getListMenuItemsQueryKey, getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import type { MenuItem, Category } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageLoader } from "@/components/LoadingSpinner";
import { MediaUpload } from "@/components/MediaUpload";
import { cn } from "@/lib/utils";

type ItemForm = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string | null;
  videoUrl: string | null;
  isVeg: boolean;
  available: boolean;
  isFeatured: boolean;
};

const EMPTY_FORM: ItemForm = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  imageUrl: null,
  videoUrl: null,
  isVeg: true,
  available: true,
  isFeatured: false,
};

function VegDot({ isVeg }: { isVeg: boolean }) {
  return (
    <span className={cn(
      "h-5 w-5 rounded-sm border-2 flex items-center justify-center bg-white flex-shrink-0",
      isVeg ? "border-green-600" : "border-red-600"
    )}>
      {isVeg ? <Leaf className="h-3 w-3 text-green-600" /> : <Drumstick className="h-3 w-3 text-red-600" />}
    </span>
  );
}

export default function AdminMenuPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading: catsLoading } = useListCategories();
  const { data: items = [], isLoading: itemsLoading } = useListMenuItems({});

  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [search, setSearch] = useState("");
  const [activeCatFilter, setActiveCatFilter] = useState<string>("all");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
    qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setItemDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl ?? null,
      videoUrl: (item as unknown as { videoUrl?: string | null }).videoUrl ?? null,
      isVeg: item.isVeg,
      available: item.available,
      isFeatured: item.isFeatured,
    });
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast({ title: "Please fill name, price and category", variant: "destructive" });
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Enter a valid price", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        imageUrl: form.imageUrl || null,
        videoUrl: form.videoUrl || null,
        categoryId: form.categoryId,
        isVeg: form.isVeg,
        available: form.available,
        isFeatured: form.isFeatured,
      };

      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, data: payload });
        toast({ title: "Item updated" });
      } else {
        await createItem.mutateAsync({ data: payload });
        toast({ title: "Item added" });
      }
      invalidate();
      setItemDialogOpen(false);
    } catch {
      toast({ title: "Failed to save item", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteItem.mutateAsync({ id });
      invalidate();
      toast({ title: "Item deleted" });
    } catch {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    try {
      await updateItem.mutateAsync({
        id: item.id,
        data: {
          name: item.name,
          description: item.description ?? null,
          price: item.price,
          imageUrl: item.imageUrl ?? null,
          videoUrl: (item as unknown as { videoUrl?: string | null }).videoUrl ?? null,
          categoryId: item.categoryId,
          isVeg: item.isVeg,
          available: !item.available,
          isFeatured: item.isFeatured,
        },
      });
      invalidate();
    } catch {
      toast({ title: "Failed to update availability", variant: "destructive" });
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const slug = newCatName.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      await createCategory.mutateAsync({ data: { name: newCatName.trim(), slug } });
      invalidate();
      setNewCatName("");
      setCatDialogOpen(false);
      toast({ title: "Category created" });
    } catch {
      toast({ title: "Failed to create category", variant: "destructive" });
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Delete this category? All items in it will also be deleted.")) return;
    try {
      await deleteCategory.mutateAsync({ id });
      invalidate();
      toast({ title: "Category deleted" });
    } catch {
      toast({ title: "Failed to delete category", variant: "destructive" });
    }
  };

  const toggleCat = (id: string) => {
    setExpandedCats((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (catsLoading || itemsLoading) return <PageLoader />;

  const filteredItems = items.filter((item) => {
    const matchCat = activeCatFilter === "all" || item.categoryId === activeCatFilter;
    const matchSearch = !search.trim() || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name ?? "Unknown";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Menu Management</h1>
          <p className="text-muted-foreground text-sm">
            {items.length} items across {categories.length} categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)}>
            <FolderOpen className="h-4 w-4 mr-1.5" /> Add Category
          </Button>
          <Button size="sm" onClick={openAdd} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Add Item
          </Button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={activeCatFilter} onValueChange={setActiveCatFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories section */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const catItems = filteredItems.filter((i) => i.categoryId === cat.id);
          if (activeCatFilter !== "all" && activeCatFilter !== cat.id) return null;
          const isExpanded = expandedCats.has(cat.id) || activeCatFilter === cat.id;

          return (
            <div key={cat.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <button
                  className="flex items-center gap-2 font-semibold text-sm flex-1 text-left"
                  onClick={() => toggleCat(cat.id)}
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  {cat.name}
                  <Badge variant="secondary" className="ml-1 text-xs">{catItems.length}</Badge>
                </button>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                  title="Delete category"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <AnimatePresence>
                {(isExpanded || !expandedCats.size) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    {catItems.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-muted-foreground text-center">
                        No items in this category
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {catItems.map((item) => (
                          <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                            {/* Thumbnail */}
                            <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🍽</div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm truncate">{item.name}</p>
                                <VegDot isVeg={item.isVeg} />
                                {item.isFeatured && (
                                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-400 flex-shrink-0" />
                                )}
                                {(item as unknown as { videoUrl?: string | null }).videoUrl && (
                                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold text-purple-600 border-purple-300">
                                    VIDEO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-primary font-bold mt-0.5">₹{item.price}</p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Switch
                                checked={item.available}
                                onCheckedChange={() => handleToggleAvailable(item)}
                                className="scale-90"
                              />
                              <span className={cn("text-[10px] font-semibold w-14 text-right", item.available ? "text-green-600" : "text-muted-foreground")}>
                                {item.available ? "Available" : "Hidden"}
                              </span>
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">Create a category first, then add menu items.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setCatDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Category
            </Button>
          </div>
        )}
      </div>

      {/* ── Add/Edit Item Dialog ─────────────────────────────────────────── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Item Name *</label>
              <Input
                placeholder="e.g. Butter Chicken"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Description</label>
              <Textarea
                placeholder="Short description of the dish..."
                rows={2}
                className="resize-none"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Price (₹) *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 299"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Category *</label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload */}
            <MediaUpload
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              accept="image"
              label="Food Image"
            />

            {/* Video Upload */}
            <MediaUpload
              value={form.videoUrl}
              onChange={(url) => setForm((f) => ({ ...f, videoUrl: url }))}
              accept="video"
              label="Food Video (optional)"
            />

            {/* Toggles */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: "isVeg", label: "Vegetarian", color: "text-green-600" },
                { key: "available", label: "Available", color: "text-blue-600" },
                { key: "isFeatured", label: "Featured", color: "text-yellow-600" },
              ] as { key: keyof ItemForm; label: string; color: string }[]).map(({ key, label, color }) => (
                <div key={key} className="flex flex-col items-center gap-2 p-3 bg-muted/40 rounded-xl border border-border">
                  <Switch
                    checked={form[key] as boolean}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                  />
                  <span className={cn("text-xs font-semibold text-center", color)}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white min-w-[100px]">
              {saving ? "Saving..." : editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Category Dialog ──────────────────────────────────────────── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Category Name</label>
              <Input
                placeholder="e.g. Starters, Mains, Drinks..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCategory} disabled={savingCat || !newCatName.trim()} className="bg-red-600 hover:bg-red-700 text-white">
              {savingCat ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
