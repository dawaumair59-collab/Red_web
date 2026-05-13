import { useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { CheckCircle2, Clock, ChefHat, Bell, Truck, XCircle, CreditCard } from "lucide-react";
import { useGetOrder, getGetOrderQueryKey, useCreatePaymentOrder, useVerifyPayment } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const STATUS_STEPS = [
  { status: "pending", label: "Order Placed", icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "preparing", label: "Preparing", icon: ChefHat },
  { status: "ready", label: "Ready", icon: Bell },
  { status: "delivered", label: "Delivered", icon: Truck },
];

const STATUS_ORDER = ["pending", "confirmed", "preparing", "ready", "delivered"];

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPayment = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();
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

  const handlePay = async () => {
    if (!order) return;
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast({ title: "Payment system unavailable", variant: "destructive" });
      return;
    }
    createPayment.mutate(
      { data: { orderId: order.id, amount: order.totalAmount } },
      {
        onSuccess: (payOrder) => {
          const rzp = new window.Razorpay({
            key: payOrder.keyId,
            amount: payOrder.amount,
            currency: payOrder.currency,
            order_id: payOrder.razorpayOrderId,
            name: "Tasty Point",
            description: `Order #${order.id.slice(0, 8)}`,
            handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
              verifyPayment.mutate(
                {
                  data: {
                    orderId: order.id,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                  },
                },
                {
                  onSuccess: () => setLocation(`/order/${order.id}/success`),
                  onError: () => toast({ title: "Payment verification failed", variant: "destructive" }),
                }
              );
            },
            theme: { color: "#c41230" },
          });
          rzp.open();
        },
        onError: () => toast({ title: "Failed to initiate payment", variant: "destructive" }),
      }
    );
  };

  if (isLoading) return <PageLoader />;
  if (!order) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Order not found</p>
    </div>
  );

  const currentStep = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Order Status</h1>
          <p className="text-sm text-muted-foreground">Table {order.tableNumber} — Order #{order.id.slice(0, 8)}</p>
        </div>

        {order.status !== "cancelled" && (
          <div className="bg-card border border-card-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.status} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                      done ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    } ${active ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className={`text-xs font-medium text-center leading-tight ${done ? "text-primary" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className="absolute" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold">Order Details</span>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} data-testid="status-order" />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>
          <div className="divide-y divide-border">
            {(order.items as Array<{ menuItemId: string; name: string; price: number; quantity: number }>).map((item, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between" data-testid={`row-order-item-${i}`}>
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 bg-muted/40 flex items-center justify-between font-bold">
            <span>Total</span>
            <span className="text-primary" data-testid="text-order-total">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {order.paymentStatus === "unpaid" && order.status !== "cancelled" && (
          <Button
            className="w-full h-12 text-base font-semibold gap-2"
            onClick={handlePay}
            disabled={createPayment.isPending || verifyPayment.isPending}
            data-testid="button-pay-now"
          >
            <CreditCard className="h-5 w-5" />
            {createPayment.isPending ? "Preparing payment..." : `Pay ₹${order.totalAmount.toFixed(2)}`}
          </Button>
        )}
      </main>
    </div>
  );
}
