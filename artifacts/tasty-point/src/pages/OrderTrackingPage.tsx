import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import {
  CheckCircle2, Clock, ChefHat, Bell, Truck, XCircle,
  CreditCard, Banknote, Smartphone, AlertCircle, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetOrder, getGetOrderQueryKey,
  useCreatePaymentOrder, useVerifyPayment,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const STATUS_STEPS = [
  { status: "pending",   label: "Placed",    icon: Clock },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "preparing", label: "Preparing", icon: ChefHat },
  { status: "ready",     label: "Ready",     icon: Bell },
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
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPayment = useCreatePaymentOrder();
  const verifyPayment = useVerifyPayment();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPayTriggered = useRef(false);
  const [payError, setPayError] = useState(false);
  const [isInitiatingPay, setIsInitiatingPay] = useState(false);

  const autoPay = new URLSearchParams(search).get("pay") === "1";

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
    setPayError(false);
    setIsInitiatingPay(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      setIsInitiatingPay(false);
      toast({ title: "Payment system unavailable. Please try again.", variant: "destructive" });
      return;
    }
    createPayment.mutate(
      { data: { orderId: order.id, amount: order.totalAmount } },
      {
        onSuccess: (payOrder) => {
          setIsInitiatingPay(false);
          const rzp = new window.Razorpay({
            key: payOrder.keyId,
            amount: payOrder.amount,
            currency: payOrder.currency,
            order_id: payOrder.razorpayOrderId,
            name: "Tasty Point",
            description: `Order #${order.id.slice(0, 8).toUpperCase()}`,
            prefill: {
              name: order.customerName ?? "",
            },
            handler: (response: {
              razorpay_order_id: string;
              razorpay_payment_id: string;
              razorpay_signature: string;
            }) => {
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
                  onError: () => {
                    setPayError(true);
                    toast({ title: "Payment verification failed. Contact support.", variant: "destructive" });
                  },
                }
              );
            },
            modal: {
              ondismiss: () => {
                setIsInitiatingPay(false);
              },
            },
            theme: { color: "#c41230" },
          });
          rzp.open();
        },
        onError: () => {
          setIsInitiatingPay(false);
          setPayError(true);
          toast({ title: "Failed to initiate payment. Please retry.", variant: "destructive" });
        },
      }
    );
  };

  // Auto-trigger Razorpay for online orders navigated with ?pay=1
  useEffect(() => {
    if (
      autoPay &&
      order &&
      !autoPayTriggered.current &&
      order.paymentStatus === "unpaid" &&
      order.paymentMethod !== "cod"
    ) {
      autoPayTriggered.current = true;
      handlePay();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, autoPay]);

  if (isLoading) return <PageLoader />;
  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const currentStep = STATUS_ORDER.indexOf(order.status);
  const isCOD = order.paymentMethod === "cod";
  const orderItems = order.items as Array<{
    menuItemId: string; name: string; price: number; quantity: number;
  }>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold"
          >
            Order Status
          </motion.h1>
          <p className="text-sm text-muted-foreground">
            Table #{order.tableNumber}
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
              {/* Track line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-border" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-primary transition-all duration-700"
                style={{
                  width: currentStep <= 0 ? 0
                    : `calc(${(currentStep / (STATUS_STEPS.length - 1)) * 100}% - 0px)`,
                }}
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
                    <span className={cn(
                      "text-[10px] font-medium text-center leading-tight",
                      done ? "text-primary" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Cancelled banner */}
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

        {/* Order details card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-card-border rounded-2xl overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="font-semibold">Order Details</span>
            <div className="flex items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
          </div>

          {/* Items */}
          <div className="divide-y divide-border">
            {orderItems.map((item, i) => (
              <div
                key={i}
                className="px-4 py-3 flex items-center justify-between"
                data-testid={`row-order-item-${i}`}
              >
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{(item.price * item.quantity).toFixed(0)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-4 py-3 bg-muted/30 space-y-1.5">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{(order.totalAmount / 1.05).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST (5%)</span>
              <span>₹{(order.totalAmount - order.totalAmount / 1.05).toFixed(0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary" data-testid="text-order-total">₹{order.totalAmount.toFixed(0)}</span>
            </div>
          </div>

          {/* Special requests */}
          {order.specialRequests && (
            <div className="px-4 py-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Instructions</p>
              <p className="text-sm text-foreground">{order.specialRequests}</p>
            </div>
          )}
        </motion.div>

        {/* Payment section */}
        <AnimatePresence>
          {order.status !== "cancelled" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isCOD ? (
                /* COD — pay at counter */
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Banknote className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">Pay at Counter</p>
                    <p className="text-sm text-amber-700">
                      ₹{order.totalAmount.toFixed(0)} is due at the billing counter. Cash or card accepted.
                    </p>
                  </div>
                </div>
              ) : order.paymentStatus === "paid" ? (
                /* Paid */
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">Payment Received</p>
                    <p className="text-sm text-green-700">
                      ₹{order.totalAmount.toFixed(0)} paid online successfully.
                    </p>
                  </div>
                </div>
              ) : (
                /* Unpaid online — show pay button */
                <div className="space-y-3">
                  {payError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-3.5"
                    >
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-destructive">Payment failed</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your order is saved. Please try again or ask staff for help.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <Button
                    className="w-full h-12 text-base font-semibold gap-2"
                    onClick={handlePay}
                    disabled={isInitiatingPay || createPayment.isPending || verifyPayment.isPending}
                    data-testid="button-pay-now"
                  >
                    {isInitiatingPay || createPayment.isPending ? (
                      <><RefreshCw className="h-5 w-5 animate-spin" /> Preparing payment…</>
                    ) : verifyPayment.isPending ? (
                      <><RefreshCw className="h-5 w-5 animate-spin" /> Verifying…</>
                    ) : (
                      <>
                        <Smartphone className="h-5 w-5" />
                        Pay ₹{order.totalAmount.toFixed(0)} via UPI / Card / Wallet
                      </>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Cards</span>
                    <span>·</span>
                    <span>UPI</span>
                    <span>·</span>
                    <span><Smartphone className="h-3 w-3 inline mr-0.5" />Wallets</span>
                    <span>·</span>
                    <span>Net Banking</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-refresh note */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Status updates automatically every 5 seconds
        </p>
      </main>
    </div>
  );
}
