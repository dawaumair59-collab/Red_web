import { ShoppingCart, UtensilsCrossed } from "lucide-react";
import { Link } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  onCartClick?: () => void;
  tableId?: string;
}

export function Navbar({ onCartClick, tableId }: NavbarProps) {
  const { items } = useCart();
  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full bg-primary shadow-md">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href={tableId ? `/menu?tableId=${tableId}` : "/"}
          className="flex items-center gap-2 text-white font-bold text-lg"
          data-testid="link-logo"
        >
          <UtensilsCrossed className="h-5 w-5" />
          <span>Tasty Point</span>
        </Link>
        {onCartClick && (
          <Button
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-white/20"
            onClick={onCartClick}
            data-testid="button-cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center"
                data-testid="text-cart-count"
              >
                {totalItems}
              </span>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}
