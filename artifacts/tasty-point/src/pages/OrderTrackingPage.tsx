import { useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { CheckCircle2, Clock, ChefHat, Bell, Truck, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const STATUS_STEPS = [
  { status: "pending",   label: "Placed",    icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "preparing", label: "Preparing", icon: ChefHat },
  { status: "ready",     label: "Ready",     icon: Bell },
  { status: "delivered", label: "Delivered", icon: Truck },
];
const STATUS_ORDER = ["pending", "confirmed", "preparing", "ready", "delivered"];

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  useEffect(() => {
    if (!id) return;
    pollingRef.current = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
    }, 5000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [id, queryClient]);

  if (isLoading) return <PageLoader />;
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const currentStep = STATUS_ORDER.indexOf(order.status);
  const orderItems = order.items as Array<{ menuItemId: string; name: string; price: number; quantity: number }>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        <div className="text-center space-y-1">
          <motion.h1 initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold">
            Order Status
          </motion.h1>
          <p className="text-sm text-muted-foreground">
            Table {order.tableNumber}
            {order.customerName && ` · ${order.customerName}`}
            {" · "}Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Progress stepper */}
        {order.status !== "cancelled" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-card-border rounded-2xl p-4"
          >
            <div className="relative flex items-start justify-between">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
                style={{ width: currentStep <= 0 ? 0 : `calc(${(currentStep / (STATUS_STEPS.length - 1)) * 100}% - 0px)` }}
              />
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.status} className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
                    <motion.div
                      animate={active ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500 shadow-sm",
                        done ? "bg-primary text-white" : "bg-card border-2 border-border text-muted-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </motion.div>
                    <span className={cn("text-[10px] font-medium text-center leading-tight", done ? "text-primary" : "text-muted-foreground")}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Cancelled */}
        {order.status === "cancelled" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 bg-destructive/10 border border-destructive/20 rounded-2xl p-4"
          >
            <XCircle className="h-8 w-8 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive">Order Cancelled</p>
              <p className="text-sm text-muted-foreground">This order was cancelled. Please place a new order.</p>
            </div>
          </motion.div>
        )}

        {/* Ready banner */}
        <AnimatePresence>
          {order.status === "ready" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4"
            >
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Your order is ready! 🎉</p>
                <p className="text-sm text-green-700">Please collect your order from the counter.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order details */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-card-border rounded-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold">Order Details</span>
            <OrderStatusBadge status={order.status} />
          </div>

          <div className="divide-y divide-border">
            {orderItems.map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between" data-testid={`row-order-item-${i}`}>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-3 bg-muted/30 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{(Number(order.totalAmount) / 1.05).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST (5%)</span>
              <span>₹{(Number(order.totalAmount) - Number(order.totalAmount) / 1.05).toFixed(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary" data-testid="text-order-total">₹{Number(order.totalAmount).toFixed(0)}</span>
            </div>
          </div>

          {order.specialRequests && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Special Instructions</p>
              <p className="text-sm text-foreground">{order.specialRequests}</p>
            </div>
          )}
        </motion.div>

        <p className="text-center text-xs text-muted-foreground pb-4">
          Status updates automatically every 5 seconds
        </p>
      </main>
    </div>
  );
}
