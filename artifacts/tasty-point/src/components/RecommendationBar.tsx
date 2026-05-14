import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/data/menuData";

const FOOD_EMOJIS: Record<string, string> = {
  mains: "🍛", breads: "🫓", starters: "🥙", drinks: "🥤", desserts: "🍮",
};

interface RecommendationBarProps {
  items: MenuItem[];
  label?: string;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

export function RecommendationBar({
  items,
  label = "You might also like",
  isLoading,
  className,
  compact = false,
}: RecommendationBarProps) {
  const { items: cartItems, addItem, updateQuantity } = useCart();

  if (isLoading || items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.25 }}
        className={cn("space-y-2", className)}
      >
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <p className="text-xs font-semibold text-foreground">{label}</p>
        </div>

        <div className={cn("flex gap-2 overflow-x-auto pb-1 no-scrollbar", compact ? "" : "")}>
          {items.map((item) => {
            const cartItem = cartItems.find((c) => c.menuItemId === item.id);
            const qty = cartItem?.quantity ?? 0;
            const emoji = FOOD_EMOJIS[item.categoryId] ?? "🍽";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-shrink-0 flex items-center gap-2 bg-muted rounded-xl px-2.5 py-2 min-w-0 max-w-[160px] border border-border"
              >
                <div className="text-xl w-8 h-8 flex items-center justify-center rounded-lg bg-background flex-shrink-0">
                  {emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-primary font-bold">₹{item.price}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => {
                    if (qty === 0) {
                      addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: null });
                    } else {
                      updateQuantity(item.id, qty + 1);
                    }
                  }}
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    qty > 0
                      ? "bg-primary text-white"
                      : "bg-background border border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                  data-testid={`button-rec-add-${item.id}`}
                >
                  {qty > 0 ? (
                    <span className="text-[10px] font-bold">{qty}</span>
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
