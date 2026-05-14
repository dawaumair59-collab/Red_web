import { Plus, Minus, Leaf, Drumstick, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  videoUrl?: string | null;
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
  const isVeg = item.isVeg !== false;
  const hasVideo = !!item.videoUrl;

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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm cursor-pointer group border border-gray-100",
        !item.available && "opacity-55"
      )}
      onClick={() => item.available && onDetails?.(item)}
      data-testid={`card-product-${item.id}`}
      whileHover={item.available ? { y: -3, boxShadow: "0 12px 32px rgba(0,0,0,0.10)" } : {}}
      whileTap={item.available ? { scale: 0.98 } : {}}
    >
      {/* Image / Video */}
      <div className="relative h-36 overflow-hidden bg-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <span className="text-4xl select-none">🍽</span>
          </div>
        )}

        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold tracking-wider bg-black/40 px-2.5 py-1 rounded-full uppercase">
              Unavailable
            </span>
          </div>
        )}

        {/* Video badge */}
        {hasVideo && item.available && (
          <div className="absolute bottom-2 left-2">
            <span className="flex items-center gap-1 text-[9px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Play className="h-2.5 w-2.5 fill-white" /> VIDEO
            </span>
          </div>
        )}

        {/* Popular badge */}
        {item.isFeatured && item.available && (
          <div className="absolute top-2 left-2">
            <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full tracking-wide uppercase">
              Popular
            </span>
          </div>
        )}

        {/* Veg/Non-veg badge */}
        <div className="absolute top-2 right-2">
          <span
            className={cn(
              "h-5 w-5 rounded-sm border-2 flex items-center justify-center bg-white shadow",
              isVeg ? "border-green-600" : "border-red-600"
            )}
            title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
          >
            {isVeg
              ? <Leaf className="h-2.5 w-2.5 text-green-600" />
              : <Drumstick className="h-2.5 w-2.5 text-red-600" />
            }
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-2" data-testid={`text-name-${item.id}`}>
          {item.name}
        </p>

        {item.description && (
          <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-black text-sm text-gray-900" data-testid={`text-price-${item.id}`}>
            ₹{item.price.toFixed(0)}
          </span>

          {!item.available ? (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          ) : qty === 0 ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md hover:bg-red-700 transition-colors"
              onClick={handleAdd}
              data-testid={`button-add-${item.id}`}
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="qty-controls"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 bg-red-600 rounded-full px-1 py-0.5 shadow-md"
              >
                <button
                  className="h-5 w-5 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
                  onClick={handleDecrease}
                  data-testid={`button-decrease-${item.id}`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-xs font-black text-white" data-testid={`text-qty-${item.id}`}>
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
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 bg-gray-100 rounded-full w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded-full w-full" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-4 bg-gray-100 rounded-full w-12" />
          <div className="h-7 w-7 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}
