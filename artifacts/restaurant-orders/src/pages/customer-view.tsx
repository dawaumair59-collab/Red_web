import React, { useState } from "react";
import { useListOrders, useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OrderInputItemsItem } from "@workspace/api-client-react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import ConnectionBadge from "@/components/ConnectionBadge";
import { Link } from "wouter";

const SAMPLE_MENU = [
  { id: "m1", name: "Classic Smashburger", price: 12.00, category: "Mains" },
  { id: "m2", name: "Spicy Chicken Sandwich", price: 11.50, category: "Mains" },
  { id: "m3", name: "Grilled Salmon", price: 18.00, category: "Mains" },
  { id: "m4", name: "Garlic Bread", price: 4.50, category: "Sides" },
  { id: "m5", name: "Truffle Fries", price: 6.00, category: "Sides" },
  { id: "m6", name: "Caesar Salad", price: 8.50, category: "Salads" },
  { id: "m7", name: "Vanilla Shake", price: 5.00, category: "Drinks" },
  { id: "m8", name: "Craft Cola", price: 3.00, category: "Drinks" },
];

const STATUS_STEPS = ["pending", "accepted", "preparing", "ready", "delivered"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Order Received",
  accepted: "Accepted by Kitchen",
  preparing: "Being Prepared",
  ready: "Ready for Pickup",
  delivered: "Delivered",
};

export default function CustomerView() {
  const [tableNumber, setTableNumber] = useState<string>("");
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [specialRequests, setSpecialRequests] = useState("");
  const { toast } = useToast();

  const createOrder = useCreateOrder();
  const { status: connectionStatus } = useRealtimeOrders();

  const { data: orders = [] } = useListOrders(
    { tableNumber: activeTable ?? undefined },
    { query: { refetchInterval: 8000, enabled: activeTable !== null } }
  );

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(tableNumber, 10);
    if (!isNaN(num) && num > 0) setActiveTable(num);
  };

  const addToCart = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const removeFromCart = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });

  const cartTotal = SAMPLE_MENU.reduce((sum, item) => sum + (cart[item.id] || 0) * item.price, 0);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const handlePlaceOrder = () => {
    if (activeTable === null || Object.keys(cart).length === 0) return;

    const items: OrderInputItemsItem[] = Object.entries(cart).map(([id, quantity]) => {
      const menuItem = SAMPLE_MENU.find((m) => m.id === id)!;
      return { menuItemId: id, name: menuItem.name, price: menuItem.price, quantity };
    });

    // Optimistic: show placing state
    createOrder.mutate(
      {
        data: {
          tableNumber: activeTable,
          items,
          specialRequests: specialRequests || undefined,
        },
      },
      {
        onSuccess: () => {
          setCart({});
          setSpecialRequests("");
          toast({ title: "Order placed!", description: "Your kitchen is on it." });
        },
        onError: () => {
          toast({ title: "Failed to place order", variant: "destructive" });
        },
      }
    );
  };

  const currentOrder = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  // Group menu by category
  const categories = [...new Set(SAMPLE_MENU.map((m) => m.category))];

  if (activeTable === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold font-mono tracking-tight">Table Ordering</h1>
            <p className="text-muted-foreground text-sm mt-1">Enter your table number to get started</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleStartSession} className="space-y-4">
                <Input
                  type="number"
                  min="1"
                  placeholder="Table Number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  className="text-center text-2xl font-mono h-14"
                />
                <Button type="submit" className="w-full h-12 text-base">
                  Start Ordering
                </Button>
              </form>
            </CardContent>
          </Card>
          <div className="flex justify-center">
            <ConnectionBadge status={connectionStatus} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto p-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center pt-2">
        <div>
          <h1 className="text-2xl font-bold font-mono">Table {activeTable}</h1>
          <ConnectionBadge status={connectionStatus} />
        </div>
        <div className="flex gap-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="text-xs">Admin</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setActiveTable(null)}>
            Change Table
          </Button>
        </div>
      </div>

      {/* Live Order Status */}
      {currentOrder && (
        <Card className={`border ${currentOrder.status === "ready" ? "border-green-500" : "border-primary/30"}`}>
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">
                Live Order Status
              </CardTitle>
              <span className="text-xs font-mono text-muted-foreground">#{currentOrder.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {/* Timeline */}
            <div className="flex items-center justify-between relative mb-4">
              <div className="absolute left-0 top-2 w-full h-0.5 bg-muted" />
              {STATUS_STEPS.map((step, idx) => {
                const currentIdx = STATUS_STEPS.indexOf(currentOrder.status as typeof STATUS_STEPS[number]);
                const isCompleted = idx <= currentIdx;
                const isActive = idx === currentIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-1.5 z-10 bg-card px-0.5">
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        isCompleted ? "bg-primary border-primary" : "bg-muted border-muted-foreground/30"
                      } ${isActive ? "ring-4 ring-primary/20 scale-125" : ""}`}
                    />
                    <span
                      className={`text-[10px] capitalize font-mono text-center leading-tight ${
                        isCompleted ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={`text-center text-sm font-medium mt-2 ${currentOrder.status === "ready" ? "text-green-400" : "text-muted-foreground"}`}>
              {STATUS_LABELS[currentOrder.status] ?? currentOrder.status}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t text-sm font-mono text-muted-foreground">
              <span>{currentOrder.items.length} item(s)</span>
              <span>${currentOrder.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menu */}
      <div>
        <h2 className="font-bold text-lg mb-4 font-mono uppercase tracking-wide">Menu</h2>
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat}>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{cat}</h3>
              <div className="space-y-2">
                {SAMPLE_MENU.filter((m) => m.category === cat).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded border bg-card hover:border-primary/30 transition-colors">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground text-sm font-mono">${item.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {cart[item.id] > 0 && (
                        <>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => removeFromCart(item.id)}>
                            -
                          </Button>
                          <span className="w-6 text-center font-mono font-bold">{cart[item.id]}</span>
                        </>
                      )}
                      <Button variant={cart[item.id] > 0 ? "default" : "secondary"} size="sm" className="h-8 w-8 p-0" onClick={() => addToCart(item.id)}>
                        +
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart / Order Panel */}
      {cartCount > 0 && (
        <Card className="border-primary/50 sticky bottom-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bold">{cartCount} item(s)</span>
              <span className="font-mono font-bold text-primary">${cartTotal.toFixed(2)}</span>
            </div>
            <Input
              placeholder="Special requests (optional)"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              className="text-sm"
            />
            <Button
              className="w-full h-12 text-base"
              onClick={handlePlaceOrder}
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? "Placing Order..." : "Place Order"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
