import { useState, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, X, SlidersHorizontal, ShoppingCart, Leaf, Drumstick } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useListCategories, useListMenuItems } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuItemCard, MenuItemCardSkeleton } from "@/components/MenuItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

type DietFilter = "all" | "veg" | "nonveg";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg?: boolean | null;
  available: boolean;
  isFeatured?: boolean | null;
  categoryId?: string | null;
}

function CategoryPill({
  label,
  active,
  onClick,
  testId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-card border border-card-border text-muted-foreground hover:border-primary hover:text-primary"
      )}
    >
      {label}
    </button>
  );
}

function StickyCartButton({ count, total, onClick }: { count: number; total: number; onClick: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4"
        >
          <button
            onClick={onClick}
            className="flex items-center gap-3 bg-primary text-white rounded-2xl shadow-lg px-5 py-3.5 max-w-sm w-full hover:bg-primary/90 active:scale-95 transition-transform"
            data-testid="button-sticky-cart"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 h-4 w-4 bg-white text-primary text-[10px] font-bold rounded-full flex items-center justify-center">
                {count}
              </span>
            </div>
            <span className="flex-1 text-left text-sm font-semibold">
              {count} item{count !== 1 ? "s" : ""} in your order
            </span>
            <span className="text-sm font-bold">₹{total.toFixed(0)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MenuPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const params = new URLSearchParams(search);
  const tableId = params.get("tableId") ?? "";

  const [cartOpen, setCartOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const { items: cartItems, total } = useCart();
  const cartCount = cartItems.reduce((a, i) => a + i.quantity, 0);

  const { data: categories, isLoading: catsLoading } = useListCategories();
  const { data: allItems, isLoading: itemsLoading } = useListMenuItems({ available: true });

  const loading = catsLoading || itemsLoading;

  const filtered = useMemo(() => {
    let list = (allItems ?? []) as MenuItem[];
    if (activeCategory !== "all") list = list.filter((i) => i.categoryId === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
      );
    }
    if (dietFilter === "veg") list = list.filter((i) => i.isVeg !== false);
    if (dietFilter === "nonveg") list = list.filter((i) => i.isVeg === false);
    return list;
  }, [allItems, activeCategory, query, dietFilter]);

  const featured = useMemo(
    () => (allItems ?? []).filter((i) => i.isFeatured && i.available).slice(0, 4) as MenuItem[],
    [allItems]
  );

  if (!tableId) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-28">
      <Navbar onCartClick={() => setCartOpen(true)} tableId={tableId} />

      <main className="flex-1 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-foreground">Our Menu</h1>
              <p className="text-xs text-muted-foreground">Table #{tableId.slice(0, 6)}</p>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors",
                showFilters || dietFilter !== "all"
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
              data-testid="button-filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters{dietFilter !== "all" ? " ·" : ""}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-muted rounded-xl border border-transparent focus:border-primary focus:bg-background focus:outline-none transition-colors"
              data-testid="input-search"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Diet filter */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pt-3">
                  {(
                    [
                      { id: "all", label: "All Items" },
                      { id: "veg", label: "Veg Only", icon: <Leaf className="h-3 w-3 text-green-600" /> },
                      { id: "nonveg", label: "Non-Veg", icon: <Drumstick className="h-3 w-3 text-red-600" /> },
                    ] as { id: DietFilter; label: string; icon?: React.ReactNode }[]
                  ).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setDietFilter(id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                        dietFilter === id
                          ? "bg-primary text-white border-primary"
                          : "border-border text-muted-foreground hover:border-primary"
                      )}
                      data-testid={`filter-diet-${id}`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide no-scrollbar">
          <CategoryPill
            label="All"
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          />
          {(categories ?? []).map((cat) => (
            <CategoryPill
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              testId={`tab-category-${cat.id}`}
            />
          ))}
        </div>

        {/* Featured banner */}
        {!loading && activeCategory === "all" && !query && dietFilter === "all" && featured.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              ⭐ Chef's Picks
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {featured.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="flex-shrink-0 flex items-center gap-2 bg-card border border-card-border rounded-xl px-3 py-2 shadow-sm hover:border-primary transition-colors"
                  data-testid={`featured-${item.id}`}
                >
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-primary font-bold">₹{item.price.toFixed(0)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="px-4 pb-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 mt-1">
              {Array.from({ length: 6 }).map((_, i) => <MenuItemCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-3 text-center"
            >
              <span className="text-5xl">🔍</span>
              <p className="font-semibold text-foreground">No items found</p>
              <p className="text-sm text-muted-foreground">
                {query ? `No results for "${query}"` : "Nothing in this category yet"}
              </p>
              {(query || dietFilter !== "all") && (
                <button
                  className="text-sm text-primary font-medium underline"
                  onClick={() => { setQuery(""); setDietFilter("all"); }}
                  data-testid="button-clear-filters"
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2 mt-1">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                {query && ` for "${query}"`}
              </p>
              <motion.div layout className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filtered.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onDetails={setSelectedItem}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </>
          )}
        </div>
      </main>

      <StickyCartButton count={cartCount} total={total} onClick={() => setCartOpen(true)} />
      <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} tableId={tableId} />
    </div>
  );
}
