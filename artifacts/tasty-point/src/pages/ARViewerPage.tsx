import { Suspense, lazy } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, RotateCcw, ZoomIn, Smartphone, Info } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Food3DViewerSkeleton } from "@/components/Food3DViewer";
import { useCart } from "@/contexts/CartContext";
import { MENU_MAP } from "@/data/menuData";
import { useItemRecommendations } from "@/hooks/useRecommendations";
import { RecommendationBar } from "@/components/RecommendationBar";
import { cn } from "@/lib/utils";

const Food3DViewer = lazy(() =>
  import("@/components/Food3DViewer").then((m) => ({ default: m.Food3DViewer }))
);

const CATEGORY_LABELS: Record<string, string> = {
  mains: "Main Course", breads: "Bread", starters: "Starter", drinks: "Drink", desserts: "Dessert",
};

export default function ARViewerPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { items: cartItems, addItem, updateQuantity } = useCart();

  const item = MENU_MAP[id ?? ""];
  const recommendations = useItemRecommendations(id ?? "");
  const cartItem = cartItems.find((c) => c.menuItemId === id);
  const qty = cartItem?.quantity ?? 0;

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Item not found</p>
        </div>
      </div>
    );
  }

  const handleAdd = () => addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: null });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation(-1 as unknown as string)}
            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="font-bold text-xl leading-tight">{item.name}</h1>
            <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[item.categoryId] ?? item.categoryId}</p>
          </div>
        </div>

        {/* 3D Viewer */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-muted/40 to-muted/10 rounded-3xl overflow-hidden border border-border"
        >
          <Suspense fallback={<Food3DViewerSkeleton height={340} />}>
            <Food3DViewer itemId={item.id} categoryId={item.categoryId} height={340} showPlate />
          </Suspense>

          {/* Controls hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <span className="flex items-center gap-1 text-[11px] text-white/80">
              <RotateCcw className="h-3 w-3" /> Drag to rotate
            </span>
            <span className="text-white/40">·</span>
            <span className="flex items-center gap-1 text-[11px] text-white/80">
              <ZoomIn className="h-3 w-3" /> Pinch to zoom
            </span>
          </div>

          {/* Veg/Non-veg badge */}
          <div className="absolute top-3 right-3">
            <span className={cn(
              "text-[10px] font-bold px-2 py-1 rounded-full",
              item.isVeg ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {item.isVeg ? "VEG" : "NON-VEG"}
            </span>
          </div>
        </motion.div>

        {/* AR availability banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl p-3.5"
        >
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">AR Preview</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Full AR placement on your table coming soon. The 3D model above is interactive — drag to rotate, pinch to zoom.
            </p>
          </div>
        </motion.div>

        {/* Item details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold text-lg">{item.name}</h2>
              {item.description && <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>}
            </div>
            <p className="text-xl font-bold text-primary flex-shrink-0">₹{item.price}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-xs font-medium px-2.5 py-1 rounded-full",
              item.isVeg ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            )}>
              {item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {CATEGORY_LABELS[item.categoryId]}
            </span>
            {item.isFeatured && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                ⭐ Popular
              </span>
            )}
          </div>

          {/* Add to cart */}
          {qty === 0 ? (
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button className="w-full h-11 font-semibold" onClick={handleAdd}>
                Add to Order — ₹{item.price}
              </Button>
            </motion.div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-primary rounded-xl px-4 py-2.5 flex-1 justify-center">
                <button
                  className="h-7 w-7 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
                  onClick={() => updateQuantity(item.id, qty - 1)}
                >
                  <span className="text-lg font-bold">−</span>
                </button>
                <span className="text-base font-bold text-white min-w-[2ch] text-center">{qty}</span>
                <button
                  className="h-7 w-7 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors"
                  onClick={handleAdd}
                >
                  <span className="text-lg font-bold">+</span>
                </button>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">Subtotal</p>
                <p className="font-bold text-primary">₹{item.price * qty}</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-4"
          >
            <RecommendationBar items={recommendations} label="Goes well with" />
          </motion.div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground pb-4">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <p>3D models are procedurally generated. Actual dish appearance may vary slightly.</p>
        </div>
      </main>
    </div>
  );
}
