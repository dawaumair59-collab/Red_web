import { useParams, useLocation } from "wouter";
import { CheckCircle2, Banknote, Smartphone, Home, ClipboardList } from "lucide-react";
import { motion } from "framer-motion";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function ConfettiDot({ delay, color }: { delay: number; color: string }) {
  const x = (Math.random() - 0.5) * 300;
  const y = (Math.random() - 0.5) * 200 - 80;
  return (
    <motion.div
      className={cn("absolute w-2 h-2 rounded-full top-1/2 left-1/2", color)}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x, y, opacity: 0, scale: 0.3 }}
      transition={{ delay, duration: 0.9, ease: "easeOut" }}
    />
  );
}

const CONFETTI_COLORS = [
  "bg-primary", "bg-yellow-400", "bg-green-500",
  "bg-blue-500", "bg-pink-500", "bg-orange-400",
];

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  if (isLoading) return <PageLoader />;

  const isCOD = order?.paymentMethod === "cod";
  const orderItems = order?.items as Array<{
    name: string; price: number; quantity: number;
  }> | undefined;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-10 gap-6">

        {/* Animated check + confetti */}
        <div className="relative flex items-center justify-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <ConfettiDot
              key={i}
              delay={0.3 + i * 0.04}
              color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
            />
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.1 }}
            className="w-28 h-28 rounded-full bg-green-100 flex items-center justify-center shadow-lg"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35, type: "spring", stiffness: 400, damping: 20 }}
            >
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </motion.div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-1.5"
        >
          <h1 className="text-3xl font-bold text-foreground">
            {isCOD ? "Order Placed!" : "Payment Successful!"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isCOD
              ? "Your order is confirmed. Pay at the counter when your food arrives."
              : "Payment received. Your order is confirmed and being prepared."}
          </p>
        </motion.div>

        {/* Order card */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card border border-card-border rounded-2xl w-full max-w-sm overflow-hidden shadow-sm"
          >
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Summary</p>
            </div>

            {/* Items */}
            <div className="divide-y divide-border">
              {orderItems?.map((item, i) => (
                <div key={i} className="px-5 py-2.5 flex justify-between text-sm">
                  <span className="text-foreground">{item.name} × {item.quantity}</span>
                  <span className="text-muted-foreground">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-border space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Order ID</span>
                <span className="font-mono font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Table</span>
                <span className="font-medium">#{order.tableNumber}</span>
              </div>
              {order.customerName && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Name</span>
                  <span className="font-medium">{order.customerName}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>{isCOD ? "Amount Due" : "Total Paid"}</span>
                <span className="text-primary" data-testid="text-success-total">₹{order.totalAmount.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment method pill */}
            <div className="px-5 pb-4">
              <div className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5",
                isCOD ? "bg-amber-50 border border-amber-200" : "bg-green-50 border border-green-200"
              )}>
                {isCOD
                  ? <Banknote className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  : <Smartphone className="h-4 w-4 text-green-600 flex-shrink-0" />
                }
                <div>
                  <p className={cn("text-xs font-semibold", isCOD ? "text-amber-700" : "text-green-700")}>
                    {isCOD ? "Pay at Counter" : "Paid via Razorpay"}
                  </p>
                  <p className={cn("text-[11px]", isCOD ? "text-amber-600" : "text-green-600")}>
                    {isCOD ? "Cash or card accepted" : "Payment confirmed · Secured"}
                  </p>
                </div>
                {!isCOD && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto flex-shrink-0" />}
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col gap-3 w-full max-w-sm"
        >
          <Button
            className="w-full h-11 gap-2 font-semibold"
            onClick={() => setLocation(`/order/${id}`)}
            data-testid="button-track-order"
          >
            <ClipboardList className="h-4 w-4" />
            Track Order Status
          </Button>
          <Button
            variant="outline"
            className="w-full h-11 gap-2"
            onClick={() => setLocation("/")}
            data-testid="button-back-home"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
        </motion.div>

        <p className="text-xs text-muted-foreground text-center">
          Your food will be delivered to Table #{order?.tableNumber}. Enjoy your meal! 🍽
        </p>
      </main>
    </div>
  );
}
