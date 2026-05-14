import { motion, AnimatePresence } from "framer-motion";
import { X, Leaf, Drumstick, Plus, Minus, ShoppingCart, Star, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useItemRecommendations } from "@/hooks/useRecommendations";
import { RecommendationBar } from "@/components/RecommendationBar";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg?: boolean | null;
  available: boolean;
  isFeatured?: boolean | null;
  categoryId?: string;
}

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

function RecommendationsSection({ itemId }: { itemId: string }) {
  const recs = useItemRecommendations(itemId);
  if (recs.length === 0) return null;
  return (
    <div className="pt-2">
      <RecommendationBar items={recs} label="Goes well with" compact />
    </div>
  );
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const { items, addItem, updateQuantity } = useCart();
  const [, setLocation] = useLocation();
  const cartItem = item ? items.find((i) => i.menuItemId === item.id) : null;
  const qty = cartItem?.quantity ?? 0;
  const isVeg = item?.isVeg !== false;

  const handleAdd = () => {
    if (!item) return;
    addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
  };

  const handleViewAR = () => {
    if (!item) return;
    onClose();
    setTimeout(() => setLocation(`/ar/${item.id}`), 200);
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-background rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ maxHeight: "92dvh" }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(92dvh - 16px)" }}>
              {/* Image */}
              <div className="relative w-full h-56 bg-muted">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                    <span className="text-7xl">🍽</span>
                  </div>
                )}

                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  data-testid="button-close-modal"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={cn(
                    "h-6 w-6 rounded-sm border-2 flex items-center justify-center bg-white shadow",
                    isVeg ? "border-green-600" : "border-red-600"
                  )}>
                    {isVeg ? <Leaf className="h-3.5 w-3.5 text-green-600" /> : <Drumstick className="h-3.5 w-3.5 text-red-600" />}
                  </span>
                  {item.isFeatured && (
                    <span className="flex items-center gap-1 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Star className="h-2.5 w-2.5 fill-white" /> POPULAR
                    </span>
                  )}
                </div>

                {/* 3D Preview button */}
                <button
                  onClick={handleViewAR}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full hover:bg-black/70 transition-colors"
                  data-testid="button-view-3d"
                >
                  <Box className="h-3 w-3" /> View in 3D
                </button>
              </div>

              {/* Content */}
              <div className="px-5 pt-4 pb-8 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold text-foreground leading-tight" data-testid="text-modal-name">
                      {item.name}
                    </h2>
                    <p className="text-xl font-bold text-primary flex-shrink-0" data-testid="text-modal-price">
                      ₹{item.price.toFixed(0)}
                    </p>
                  </div>
                  <span className={cn("text-xs font-medium", isVeg ? "text-green-600" : "text-red-600")}>
                    {isVeg ? "Vegetarian" : "Non-Vegetarian"}
                  </span>
                </div>

                {item.description && (
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">About</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                )}

                {/* Add to cart */}
                <div className="pt-1">
                  {qty === 0 ? (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button className="w-full h-12 text-base font-semibold gap-2 rounded-xl" onClick={handleAdd} data-testid="button-modal-add">
                        <ShoppingCart className="h-5 w-5" />
                        Add to Order — ₹{item.price.toFixed(0)}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-primary rounded-xl px-4 py-2 flex-1 justify-center">
                        <button className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors" onClick={() => updateQuantity(item.id, qty - 1)} data-testid="button-modal-decrease">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-lg font-bold text-white min-w-[2ch] text-center" data-testid="text-modal-qty">{qty}</span>
                        <button className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-lg transition-colors" onClick={handleAdd} data-testid="button-modal-increase">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="font-bold text-primary">₹{(item.price * qty).toFixed(0)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {item.categoryId && <RecommendationsSection itemId={item.id} />}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
