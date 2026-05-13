import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useCreateOrder } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
}

export function CartDrawer({ open, onClose, tableId }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    createOrder.mutate(
      {
        data: {
          tableId,
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          onClose();
          setLocation(`/order/${order.id}`);
        },
        onError: () => {
          toast({ title: "Failed to place order", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Your Order
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add items from the menu to get started</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {items.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-3" data-testid={`row-cart-${item.menuItemId}`}>
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-sm text-primary font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      data-testid={`button-cart-decrease-${item.menuItemId}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                    <Button
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      data-testid={`button-cart-increase-${item.menuItemId}`}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive ml-1"
                      onClick={() => removeItem(item.menuItemId)}
                      data-testid={`button-cart-remove-${item.menuItemId}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-4 py-4 space-y-4">
              <Separator />
              <div className="flex items-center justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary" data-testid="text-cart-total">₹{total.toFixed(2)}</span>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handlePlaceOrder}
                disabled={createOrder.isPending}
                data-testid="button-place-order"
              >
                {createOrder.isPending ? "Placing Order..." : "Place Order"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
