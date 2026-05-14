import { useState, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, X, SlidersHorizontal, ShoppingCart, Leaf, Drumstick } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useListMenuItems, useListCategories } from "@workspace/api-client-react";
import type { MenuItem } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuItemCard, MenuItemCardSkeleton } from "@/components/MenuItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

type DietFilter = "all" | "veg" | "nonveg";

function CategoryPill({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border",
        active
          ? "bg-red-600 text-white shadow-md border-red-600"
          : "bg-white border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-600"
      )}
    >
      {label}
    </motion.button>
  );
}

function StickyCartButton({ count, total, onClick }: { count: number; total: number; onClick: () => void }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="flex items-center gap-3 bg-red-600 text-white rounded-2xl shadow-2xl px-5 py-4 max-w-sm w-full"
            data-testid="button-sticky-cart"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2.5 -right-2.5 h-5 w-5 bg-white text-red-600 text-[10px] font-black rounded-full flex items-center justify-center shadow">
                {count}
              </span>
            </div>
            <span className="flex-1 text-left text-sm font-bold">
              {count} item{count !== 1 ? "s" : ""} in your order
            </span>
            <span className="text-sm font-black">₹{total.toFixed(0)}</span>
          </motion.button>
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

  const { data: allItems = [], isLoading: itemsLoading } = useListMenuItems({ available: true });
  const { data: categories = [], isLoading: catsLoading } = useListCategories();
  const isLoading = itemsLoading || catsLoading;

  const featured = useMemo(() => allItems.filter((i) => i.isFeatured).slice(0, 4), [allItems]);

  const filtered = useMemo(() => {
    let list = allItems;
    if (activeCategory !== "all") list = list.filter((i) => i.categoryId === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q));
    }
    if (dietFilter === "veg") list = list.filter((i) => i.isVeg !== false);
    if (dietFilter === "nonveg") list = list.filter((i) => i.isVeg === false);
    return list;
  }, [allItems, activeCategory, query, dietFilter]);

  if (!tableId) { setLocation("/"); return null; }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-32">
      <Navbar onCartClick={() => setCartOpen(true)} tableId={tableId} />

      <main className="flex-1 max-w-2xl mx-auto w-full">
        {/* Search + Filters */}
        <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100 sticky top-14 z-30 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-gray-900">Our Menu</h1>
              <p className="text-xs text-gray-400">Table #{tableId.slice(0, 6)}</p>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                showFilters || dietFilter !== "all"
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600"
              )}
              data-testid="button-filters"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters{dietFilter !== "all" ? " ·" : ""}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, ingredients..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:border-red-500 focus:bg-white focus:outline-none transition-colors"
              data-testid="input-search"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" data-testid="button-clear-search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pt-3">
                  {([
                    { id: "all", label: "All Items" },
                    { id: "veg", label: "Veg Only", icon: <Leaf className="h-3 w-3 text-green-600" /> },
                    { id: "nonveg", label: "Non-Veg", icon: <Drumstick className="h-3 w-3 text-red-600" /> },
                  ] as { id: DietFilter; label: string; icon?: React.ReactNode }[]).map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setDietFilter(id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                        dietFilter === id ? "bg-red-600 text-white border-red-600" : "border-gray-200 text-gray-500 hover:border-red-400"
                      )}
                      data-testid={`filter-diet-${id}`}
                    >
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 no-scrollbar bg-white border-b border-gray-100">
          <CategoryPill label="All" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
          {categories.map((cat) => (
            <CategoryPill key={cat.id} label={cat.name} active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)} />
          ))}
        </div>

        {/* Featured picks */}
        {activeCategory === "all" && !query && dietFilter === "all" && featured.length > 0 && !isLoading && (
          <div className="px-4 py-4 bg-white border-b border-gray-100">
            <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">⭐ Chef's Picks</p>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {featured.map((item) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedItem(item)}
                  className="flex-shrink-0 flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl px-3 py-2.5 hover:border-red-400 transition-colors"
                  data-testid={`featured-${item.id}`}
                >
                  <div className="h-11 w-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900 max-w-[90px] truncate">{item.name}</p>
                    <p className="text-xs text-red-600 font-black">₹{item.price}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Menu grid */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <MenuItemCardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-3 text-center"
            >
              <span className="text-5xl">🔍</span>
              <p className="font-bold text-gray-900">No items found</p>
              <p className="text-sm text-gray-500">{query ? `No results for "${query}"` : "Nothing in this category"}</p>
              {(query || dietFilter !== "all") && (
                <button className="text-sm text-red-600 font-semibold underline"
                  onClick={() => { setQuery(""); setDietFilter("all"); }} data-testid="button-clear-filters">
                  Clear filters
                </button>
              )}
            </motion.div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3 font-medium">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""}{query && ` for "${query}"`}
              </p>
              <motion.div layout className="grid grid-cols-2 gap-3">
                <AnimatePresence>
                  {filtered.map((item) => (
                    <MenuItemCard key={item.id} item={item} onDetails={setSelectedItem} />
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
