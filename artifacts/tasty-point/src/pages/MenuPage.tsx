import { useState, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, X, SlidersHorizontal, ShoppingCart, Leaf, Drumstick } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { MenuItemCard, MenuItemCardSkeleton } from "@/components/MenuItemCard";
import { ItemDetailModal } from "@/components/ItemDetailModal";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

// Static menu data (replaces API-driven menu)
const MENU_ITEMS = [
  { id: "m1", name: "Butter Chicken", description: "Rich, creamy tomato curry with tender chicken", price: 320, isVeg: false, available: true, isFeatured: true, categoryId: "mains", imageUrl: null },
  { id: "m2", name: "Paneer Tikka Masala", description: "Grilled paneer in aromatic spiced gravy", price: 280, isVeg: true, available: true, isFeatured: true, categoryId: "mains", imageUrl: null },
  { id: "m3", name: "Dal Makhani", description: "Slow-cooked black lentils, butter and cream", price: 220, isVeg: true, available: true, isFeatured: false, categoryId: "mains", imageUrl: null },
  { id: "m4", name: "Grilled Fish Tikka", description: "Marinated fish grilled to perfection", price: 380, isVeg: false, available: true, isFeatured: true, categoryId: "mains", imageUrl: null },
  { id: "m5", name: "Chicken Biryani", description: "Fragrant basmati rice with spiced chicken", price: 350, isVeg: false, available: true, isFeatured: true, categoryId: "mains", imageUrl: null },
  { id: "m6", name: "Garlic Naan", description: "Soft leavened bread with garlic butter", price: 60, isVeg: true, available: true, isFeatured: false, categoryId: "breads", imageUrl: null },
  { id: "m7", name: "Tandoori Roti", description: "Whole wheat bread from the clay oven", price: 40, isVeg: true, available: true, isFeatured: false, categoryId: "breads", imageUrl: null },
  { id: "m8", name: "Butter Naan", description: "Fluffy naan brushed with melted butter", price: 55, isVeg: true, available: true, isFeatured: false, categoryId: "breads", imageUrl: null },
  { id: "m9", name: "Onion Bhaji", description: "Crispy golden fried onion fritters", price: 150, isVeg: true, available: true, isFeatured: false, categoryId: "starters", imageUrl: null },
  { id: "m10", name: "Seekh Kebab", description: "Minced lamb skewers, smoky and spiced", price: 240, isVeg: false, available: true, isFeatured: true, categoryId: "starters", imageUrl: null },
  { id: "m11", name: "Samosa (2 pcs)", description: "Crispy pastry filled with spiced potato", price: 80, isVeg: true, available: true, isFeatured: false, categoryId: "starters", imageUrl: null },
  { id: "m12", name: "Mango Lassi", description: "Chilled yoghurt drink with fresh mango", price: 120, isVeg: true, available: true, isFeatured: false, categoryId: "drinks", imageUrl: null },
  { id: "m13", name: "Masala Chai", description: "Spiced Indian milk tea", price: 60, isVeg: true, available: true, isFeatured: false, categoryId: "drinks", imageUrl: null },
  { id: "m14", name: "Cold Coffee", description: "Iced coffee with milk and sugar", price: 110, isVeg: true, available: true, isFeatured: false, categoryId: "drinks", imageUrl: null },
  { id: "m15", name: "Gulab Jamun", description: "Soft milk-solid dumplings in rose syrup", price: 100, isVeg: true, available: true, isFeatured: false, categoryId: "desserts", imageUrl: null },
  { id: "m16", name: "Kheer", description: "Rice pudding with cardamom and pistachios", price: 110, isVeg: true, available: true, isFeatured: false, categoryId: "desserts", imageUrl: null },
];

const CATEGORIES = [
  { id: "mains", name: "Mains" },
  { id: "breads", name: "Breads" },
  { id: "starters", name: "Starters" },
  { id: "drinks", name: "Drinks" },
  { id: "desserts", name: "Desserts" },
];

type MenuItem = (typeof MENU_ITEMS)[number];
type DietFilter = "all" | "veg" | "nonveg";

function CategoryPill({ label, active, onClick, testId }: { label: string; active: boolean; onClick: () => void; testId?: string }) {
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

  const filtered = useMemo(() => {
    let list = MENU_ITEMS.filter((i) => i.available);
    if (activeCategory !== "all") list = list.filter((i) => i.categoryId === activeCategory);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q));
    }
    if (dietFilter === "veg") list = list.filter((i) => i.isVeg !== false);
    if (dietFilter === "nonveg") list = list.filter((i) => i.isVeg === false);
    return list;
  }, [activeCategory, query, dietFilter]);

  const featured = useMemo(() => MENU_ITEMS.filter((i) => i.isFeatured && i.available).slice(0, 4), []);

  if (!tableId) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-28">
      <Navbar onCartClick={() => setCartOpen(true)} tableId={tableId} />

      <main className="flex-1 max-w-2xl mx-auto w-full">
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
                  {([
                    { id: "all", label: "All Items" },
                    { id: "veg", label: "Veg Only", icon: <Leaf className="h-3 w-3 text-green-600" /> },
                    { id: "nonveg", label: "Non-Veg", icon: <Drumstick className="h-3 w-3 text-red-600" /> },
                  ] as { id: DietFilter; label: string; icon?: React.ReactNode }[]).map(({ id, label, icon }) => (
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
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
          <CategoryPill label="All" active={activeCategory === "all"} onClick={() => setActiveCategory("all")} />
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              label={cat.name}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              testId={`tab-category-${cat.id}`}
            />
          ))}
        </div>

        {/* Featured */}
        {activeCategory === "all" && !query && dietFilter === "all" && featured.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">⭐ Chef's Picks</p>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {featured.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="flex-shrink-0 flex items-center gap-2 bg-card border border-card-border rounded-xl px-3 py-2 shadow-sm hover:border-primary transition-colors"
                  data-testid={`featured-${item.id}`}
                >
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">🍽️</div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-primary font-bold">₹{item.price}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="px-4 pb-4">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-3 text-center"
            >
              <span className="text-5xl">🔍</span>
              <p className="font-semibold text-foreground">No items found</p>
              <p className="text-sm text-muted-foreground">
                {query ? `No results for "${query}"` : "Nothing in this category"}
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
