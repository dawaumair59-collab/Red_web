import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Leaf, Drumstick, Plus, Minus, ShoppingCart, Star, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  categoryId?: string;
}

interface ItemDetailModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

function MediaDisplay({ item }: { item: MenuItem }) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const hasVideo = !!item.videoUrl;

  if (hasVideo) {
    return (
      <div className="relative w-full h-64 bg-black">
        {videoPlaying ? (
          <video
            src={item.videoUrl!}
            className="w-full h-full object-cover"
            autoPlay
            controls
            playsInline
            onEnded={() => setVideoPlaying(false)}
          />
        ) : (
          <>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                <span className="text-8xl">🍽</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setVideoPlaying(true)}
                className="h-16 w-16 rounded-full bg-white/90 backdrop-blur-sm shadow-2xl flex items-center justify-center"
              >
                <Play className="h-7 w-7 text-red-600 fill-red-600 ml-1" />
              </motion.button>
            </div>
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 text-[10px] font-bold bg-black/60 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                <Play className="h-2.5 w-2.5 fill-white" /> Watch Video
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 bg-gray-100">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
          <span className="text-8xl">🍽</span>
        </div>
      )}
    </div>
  );
}

export function ItemDetailModal({ item, onClose }: ItemDetailModalProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = item ? items.find((i) => i.menuItemId === item.id) : null;
  const qty = cartItem?.quantity ?? 0;
  const isVeg = item?.isVeg !== false;

  const handleAdd = () => {
    if (!item) return;
    addItem({ menuItemId: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl });
  };

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            key="sheet"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-3xl overflow-hidden shadow-2xl"
            style={{ maxHeight: "92dvh" }}
          >
            <div className="flex justify-center pt-3 pb-0">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "calc(92dvh - 16px)" }}>
              {/* Media */}
              <div className="relative">
                <MediaDisplay item={item} />
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-lg"
                  data-testid="button-close-modal"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className={cn(
                    "h-7 w-7 rounded-md border-2 flex items-center justify-center bg-white shadow-md",
                    isVeg ? "border-green-600" : "border-red-600"
                  )}>
                    {isVeg ? <Leaf className="h-3.5 w-3.5 text-green-600" /> : <Drumstick className="h-3.5 w-3.5 text-red-600" />}
                  </span>
                  {item.isFeatured && (
                    <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                      <Star className="h-2.5 w-2.5 fill-white" /> POPULAR
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="px-5 pt-5 pb-10 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight" data-testid="text-modal-name">
                      {item.name}
                    </h2>
                    <p className={cn("text-sm font-semibold mt-1", isVeg ? "text-green-600" : "text-red-500")}>
                      {isVeg ? "🟢 Vegetarian" : "🔴 Non-Vegetarian"}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-black text-red-600" data-testid="text-modal-price">
                      ₹{item.price.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-400 font-medium">per serving</p>
                  </div>
                </div>

                {item.description && (
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">About</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{item.description}</p>
                  </div>
                )}

                {/* Add to cart */}
                <div className="pt-1">
                  {qty === 0 ? (
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button
                        className="w-full h-14 text-base font-black gap-2 rounded-2xl bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                        onClick={handleAdd}
                        data-testid="button-modal-add"
                      >
                        <ShoppingCart className="h-5 w-5" />
                        Add to Order — ₹{item.price.toFixed(0)}
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4 bg-red-600 rounded-2xl px-5 py-3.5 flex-1 justify-center shadow-lg shadow-red-200">
                        <button
                          className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-xl transition-colors"
                          onClick={() => updateQuantity(item.id, qty - 1)}
                          data-testid="button-modal-decrease"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="text-lg font-black text-white min-w-[2ch] text-center" data-testid="text-modal-qty">
                          {qty}
                        </span>
                        <button
                          className="h-8 w-8 flex items-center justify-center text-white hover:bg-white/20 rounded-xl transition-colors"
                          onClick={handleAdd}
                          data-testid="button-modal-increase"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium">Subtotal</p>
                        <p className="font-black text-red-600 text-lg">₹{(item.price * qty).toFixed(0)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
