import { Plus, Minus, Leaf, Drumstick, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isVeg?: boolean | null;
  available: boolean;
  isFeatured?: boolean | null;
}

interface MenuItemCardProps {
  item: MenuItem;
  onDetails?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onDetails }: MenuItemCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.menuItemId === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, qty - 1);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
  };

  const isVeg = item.isVeg !== false;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "bg-card rounded-2xl border border-card-border overflow-hidden flex flex-col shadow-sm cursor-pointer group",
        !item.available && "opacity-55"
      )}
      onClick={() => item.available && onDetails?.(item)}
      data-testid={`card-product-${item.id}`}
      whileHover={item.available ? { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.10)" } : {}}
      whileTap={item.available ? { scale: 0.98 } : {}}
    >
      {/* Image */}
      <div className="relative h-36 overflow-hidden bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/60">
            <span className="text-4xl select-none">🍽</span>
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-semibold tracking-wide bg-black/40 px-2 py-1 rounded-full">
              UNAVAILABLE
            </span>
          </div>
        )}
        {item.isFeatured && item.available && (
          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full tracking-wide">
              POPULAR
            </span>
          </div>
        )}
        {/* Veg/Non-veg badge top-right */}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              "h-5 w-5 rounded-sm border-2 flex items-center justify-center bg-white shadow-sm",
              isVeg ? "border-green-600" : "border-red-600"
            )}
            title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
          >
            {isVeg
              ? <Leaf className="h-3 w-3 text-green-600" />
              : <Drumstick className="h-3 w-3 text-red-600" />
            }
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p className="font-semibold text-sm text-foreground leading-tight flex-1" data-testid={`text-name-${item.id}`}>
            {item.name}
          </p>
          {onDetails && item.available && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {item.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1.5">
          <span className="font-bold text-sm text-foreground" data-testid={`text-price-${item.id}`}>
            ₹{item.price.toFixed(0)}
          </span>

          {!item.available ? (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          ) : qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.93 }}
              className="h-7 px-3 text-xs font-bold rounded-full bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1"
              onClick={handleAdd}
              data-testid={`button-add-${item.id}`}
            >
              <Plus className="h-3 w-3" /> Add
            </motion.button>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="qty-controls"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-primary rounded-full px-1 py-0.5"
              >
                <button
                  className="h-5 w-5 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={handleDecrease}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-xs font-bold text-white" data-testid={`text-qty-${item.id}`}>
                  {qty}
                </span>
                <button
                  className="h-5 w-5 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={handleIncrease}
                  data-testid={`button-increase-${item.id}`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function MenuItemCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-card-border overflow-hidden flex flex-col shadow-sm animate-pulse">
      <div className="h-36 bg-muted" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 bg-muted rounded-full w-3/4" />
        <div className="h-2.5 bg-muted rounded-full w-full" />
        <div className="h-2.5 bg-muted rounded-full w-1/2" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-4 bg-muted rounded-full w-12" />
          <div className="h-7 bg-muted rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
