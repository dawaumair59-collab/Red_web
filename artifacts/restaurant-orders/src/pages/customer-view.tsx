import React, { useState } from "react";
import { useListOrders, useCreateOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { OrderInputItemsItem } from "@workspace/api-client-react";

const SAMPLE_MENU = [
  { id: "m1", name: "Classic Smashburger", price: 12.00 },
  { id: "m2", name: "Spicy Chicken Sandwich", price: 11.50 },
  { id: "m3", name: "Truffle Fries", price: 6.00 },
  { id: "m4", name: "Onion Rings", price: 5.50 },
  { id: "m5", name: "Vanilla Shake", price: 5.00 },
  { id: "m6", name: "Craft Cola", price: 3.00 },
];

const STATUS_STEPS = ["pending", "accepted", "preparing", "ready", "delivered"];

export default function CustomerView() {
  const [tableNumber, setTableNumber] = useState<string>("");
  const [activeTable, setActiveTable] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const { toast } = useToast();
  
  const createOrder = useCreateOrder();
  
  const { data: orders = [] } = useListOrders(
    { tableNumber: activeTable ?? undefined },
    { query: { refetchInterval: 5000, enabled: activeTable !== null } }
  );

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(tableNumber, 10);
    if (!isNaN(num) && num > 0) {
      setActiveTable(num);
    }
  };

  const addToCart = (id: string) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[id] > 1) {
        next[id]--;
      } else {
        delete next[id];
      }
      return next;
    });
  };

  const handlePlaceOrder = () => {
    if (activeTable === null || Object.keys(cart).length === 0) return;
    
    const items: OrderInputItemsItem[] = Object.entries(cart).map(([id, quantity]) => {
      const menuItem = SAMPLE_MENU.find(m => m.id === id)!;
      return {
        menuItemId: id,
        name: menuItem.name,
        price: menuItem.price,
        quantity,
      };
    });

    createOrder.mutate({
      data: {
        tableNumber: activeTable,
        items
      }
    }, {
      onSuccess: () => {
        setCart({});
        toast({ title: "Order placed successfully!" });
      },
      onError: () => {
        toast({ title: "Failed to place order", variant: "destructive" });
      }
    });
  };

  const currentOrder = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (activeTable === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Welcome to Table Ordering</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartSession} className="flex gap-2">
              <Input 
                type="number" 
                min="1"
                placeholder="Enter Table Number" 
                value={tableNumber} 
                onChange={(e) => setTableNumber(e.target.value)} 
                required
              />
              <Button type="submit">Start</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Table {activeTable}</h1>
        <Button variant="outline" onClick={() => setActiveTable(null)}>Change Table</Button>
      </div>

      {currentOrder && currentOrder.status !== 'delivered' && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Current Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 w-full h-1 bg-muted -z-10 -translate-y-1/2 rounded" />
              {STATUS_STEPS.map((step, idx) => {
                const stepIdx = STATUS_STEPS.indexOf(step);
                const currentIdx = STATUS_STEPS.indexOf(currentOrder.status);
                const isCompleted = stepIdx <= currentIdx;
                const isActive = stepIdx === currentIdx;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 bg-card p-1">
                    <div className={`w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-primary border-primary' : 'bg-muted border-muted'} ${isActive ? 'ring-4 ring-primary/20' : ''}`} />
                    <span className={`text-xs capitalize ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex justify-between items-center font-mono text-sm">
              <span>Order #{currentOrder.id.slice(0, 8)}</span>
              <span>Total: ${currentOrder.totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Menu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_MENU.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-muted-foreground text-sm">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {cart[item.id] > 0 && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => removeFromCart(item.id)}>-</Button>
                      <span className="w-4 text-center">{cart[item.id]}</span>
                    </>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => addToCart(item.id)}>+</Button>
                </div>
              </div>
            ))}
          </div>
          {Object.keys(cart).length > 0 && (
            <div className="mt-6 pt-6 border-t flex justify-between items-center">
              <div className="font-bold">
                Items: {Object.values(cart).reduce((a, b) => a + b, 0)}
              </div>
              <Button onClick={handlePlaceOrder} disabled={createOrder.isPending}>
                Place Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
