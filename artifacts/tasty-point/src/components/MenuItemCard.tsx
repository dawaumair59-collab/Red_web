import { Plus, Minus, Leaf, Drumstick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    isVeg?: boolean | null;
    available: boolean;
  };
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.menuItemId === item.id);
  const qty = cartItem?.quantity ?? 0;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    });
  };

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-card-border overflow-hidden flex flex-col shadow-sm transition-opacity",
        !item.available && "opacity-50"
      )}
      data-testid={`card-product-${item.id}`}
    >
      {item.imageUrl ? (
        <div className="relative h-40 overflow-hidden">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">Unavailable</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 bg-muted flex items-center justify-center">
          <span className="text-4xl">🍽</span>
        </div>
      )}

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start gap-2">
          <span
            className={cn(
              "mt-0.5 flex-shrink-0 h-4 w-4 rounded-sm border-2 flex items-center justify-center",
              item.isVeg !== false ? "border-green-600" : "border-red-600"
            )}
            title={item.isVeg !== false ? "Vegetarian" : "Non-Vegetarian"}
          >
            {item.isVeg !== false ? (
              <Leaf className="h-2.5 w-2.5 text-green-600" />
            ) : (
              <Drumstick className="h-2.5 w-2.5 text-red-600" />
            )}
          </span>
          <p className="font-semibold text-sm text-foreground leading-tight" data-testid={`text-name-${item.id}`}>
            {item.name}
          </p>
        </div>

        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-bold text-foreground" data-testid={`text-price-${item.id}`}>
            ₹{item.price.toFixed(2)}
          </span>

          {!item.available ? (
            <span className="text-xs text-muted-foreground">Unavailable</span>
          ) : qty === 0 ? (
            <Button
              size="sm"
              className="h-8 px-4 text-xs font-semibold"
              onClick={handleAdd}
              data-testid={`button-add-${item.id}`}
            >
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 border-primary text-primary hover:bg-primary hover:text-white"
                onClick={() => updateQuantity(item.id, qty - 1)}
                data-testid={`button-decrease-${item.id}`}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-6 text-center font-bold text-sm" data-testid={`text-qty-${item.id}`}>
                {qty}
              </span>
              <Button
                size="icon"
                className="h-8 w-8"
                onClick={handleAdd}
                data-testid={`button-increase-${item.id}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
