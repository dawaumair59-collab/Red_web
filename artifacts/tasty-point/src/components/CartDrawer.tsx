import { useState } from "react";
import {
  ShoppingCart, Trash2, Plus, Minus, ChevronLeft,
  CreditCard, Banknote, MessageSquare, User, ArrowRight,
  Smartphone, Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCart, type PaymentMethod } from "@/contexts/CartContext";
import { useCreateOrder } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
}

type Step = "cart" | "checkout";

const slideVariants = {
  enterRight: { x: "100%", opacity: 0 },
  enterLeft: { x: "-100%", opacity: 0 },
  center: { x: 0, opacity: 1 },
  exitRight: { x: "100%", opacity: 0 },
  exitLeft: { x: "-100%", opacity: 0 },
};

function PaymentOption({
  value,
  selected,
  icon,
  label,
  description,
  onClick,
}: {
  value: PaymentMethod;
  selected: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/40"
      )}
      data-testid={`payment-option-${value}`}
    >
      <div className={cn(
        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
        selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-semibold text-sm", selected ? "text-primary" : "text-foreground")}>{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <div className={cn(
        "h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
        selected ? "border-primary" : "border-border"
      )}>
        {selected && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
    </button>
  );
}

export function CartDrawer({ open, onClose, tableId }: CartDrawerProps) {
  const {
    items, updateQuantity, removeItem, clearCart,
    subtotal, tax, total,
    paymentMethod, setPaymentMethod,
    updateNote,
  } = useCart();
  const createOrder = useCreateOrder();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>("cart");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [customerName, setCustomerName] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const goTo = (next: Step, dir: 1 | -1) => {
    setDirection(dir);
    setStep(next);
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    const notesText = [
      orderNotes,
      ...items.filter(i => i.note).map(i => `${i.name}: ${i.note}`),
    ].filter(Boolean).join("\n") || undefined;

    createOrder.mutate(
      {
        data: {
          tableId,
          customerName: customerName.trim() || undefined,
          specialRequests: notesText,
          paymentMethod: paymentMethod as "online" | "cod",
          items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        },
      },
      {
        onSuccess: (order) => {
          clearCart();
          onClose();
          setStep("cart");
          setCustomerName("");
          setOrderNotes("");
          setLocation(`/order/${order.id}${paymentMethod === "online" ? "?pay=1" : ""}`);
        },
        onError: () => {
          toast({ title: "Failed to place order", variant: "destructive" });
        },
      }
    );
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => setStep("cart"), 300);
  };

  const isEmpty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-4 border-b border-border flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            {step === "checkout" ? (
              <button
                onClick={() => goTo("cart", -1)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors mr-1 -ml-1"
                data-testid="button-back-to-cart"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <ShoppingCart className="h-5 w-5 text-primary" />
            )}
            {step === "cart" ? "Your Order" : "Checkout"}
            {step === "cart" && items.length > 0 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {items.reduce((a, i) => a + i.quantity, 0)} item{items.reduce((a, i) => a + i.quantity, 0) !== 1 ? "s" : ""}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Steps — animated slide */}
        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {step === "cart" ? (
              <motion.div
                key="cart"
                custom={direction}
                variants={slideVariants}
                initial={direction > 0 ? "enterLeft" : "enterRight"}
                animate="center"
                exit={direction > 0 ? "exitLeft" : "exitRight"}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col"
              >
                {isEmpty ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 24 }}
                    >
                      <ShoppingCart className="h-20 w-20 text-muted-foreground/20 mx-auto" />
                    </motion.div>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground text-lg">Your cart is empty</p>
                      <p className="text-sm text-muted-foreground">Add delicious items from the menu to get started</p>
                    </div>
                    <Button variant="outline" onClick={handleClose} className="mt-2">
                      Browse Menu
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Item list */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                      <AnimatePresence>
                        {items.map((item) => (
                          <motion.div
                            key={item.menuItemId}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="bg-card border border-border rounded-xl p-3 space-y-2"
                              data-testid={`row-cart-${item.menuItemId}`}
                            >
                              <div className="flex items-center gap-3">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 text-xl">
                                    🍽
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm leading-tight truncate">{item.name}</p>
                                  <p className="text-xs text-primary font-bold mt-0.5">
                                    ₹{(item.price * item.quantity).toFixed(0)}
                                    {item.quantity > 1 && (
                                      <span className="text-muted-foreground font-normal ml-1">
                                        (₹{item.price.toFixed(0)} × {item.quantity})
                                      </span>
                                    )}
                                  </p>
                                </div>
                                {/* Qty controls */}
                                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                                  <button
                                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors text-foreground"
                                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                                    data-testid={`button-cart-decrease-${item.menuItemId}`}
                                  >
                                    {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                                  </button>
                                  <span className="w-5 text-center text-sm font-bold" data-testid={`text-cart-qty-${item.menuItemId}`}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background transition-colors"
                                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                                    data-testid={`button-cart-increase-${item.menuItemId}`}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Item note toggle */}
                              <div>
                                {expandedNote === item.menuItemId ? (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="flex gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={item.note ?? ""}
                                      onChange={(e) => updateNote(item.menuItemId, e.target.value)}
                                      placeholder="e.g. No onions, extra spicy..."
                                      className="flex-1 text-xs px-2.5 py-1.5 bg-muted rounded-lg border border-transparent focus:border-primary focus:bg-background focus:outline-none transition-colors"
                                      autoFocus
                                      data-testid={`input-item-note-${item.menuItemId}`}
                                    />
                                    <button
                                      className="text-xs text-muted-foreground hover:text-foreground px-1"
                                      onClick={() => setExpandedNote(null)}
                                    >
                                      Done
                                    </button>
                                  </motion.div>
                                ) : (
                                  <button
                                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                    onClick={() => setExpandedNote(item.menuItemId)}
                                    data-testid={`button-add-note-${item.menuItemId}`}
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    {item.note ? (
                                      <span className="text-foreground font-medium truncate max-w-[180px]">{item.note}</span>
                                    ) : "Add note"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Pricing summary + proceed */}
                    <div className="flex-shrink-0 border-t border-border px-4 pt-3 pb-5 space-y-3">
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span>
                          <span data-testid="text-cart-subtotal">₹{subtotal.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>GST (5%)</span>
                          <span data-testid="text-cart-tax">₹{tax.toFixed(0)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-base">
                          <span>Total</span>
                          <span className="text-primary" data-testid="text-cart-total">₹{total.toFixed(0)}</span>
                        </div>
                      </div>

                      <motion.div whileTap={{ scale: 0.98 }}>
                        <Button
                          className="w-full h-12 text-base font-semibold gap-2"
                          onClick={() => goTo("checkout", 1)}
                          data-testid="button-proceed-checkout"
                        >
                          Proceed to Checkout
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="checkout"
                custom={direction}
                variants={slideVariants}
                initial={direction > 0 ? "enterRight" : "enterLeft"}
                animate="center"
                exit={direction > 0 ? "exitRight" : "exitLeft"}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="absolute inset-0 flex flex-col"
              >
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                  {/* Customer Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                      Your name <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </label>
                    <Input
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      data-testid="input-customer-name"
                    />
                  </div>

                  {/* Order Notes */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Order instructions <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                    </label>
                    <Textarea
                      placeholder="Any special requests for the kitchen..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      className="resize-none"
                      data-testid="input-order-notes"
                    />
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      Payment method
                    </label>
                    <div className="space-y-2">
                      <PaymentOption
                        value="online"
                        selected={paymentMethod === "online"}
                        onClick={() => setPaymentMethod("online")}
                        icon={<Smartphone className="h-5 w-5" />}
                        label="Pay Online"
                        description="UPI, Cards, Wallets via Razorpay"
                      />
                      <PaymentOption
                        value="cod"
                        selected={paymentMethod === "cod"}
                        onClick={() => setPaymentMethod("cod")}
                        icon={<Banknote className="h-5 w-5" />}
                        label="Pay at Counter"
                        description="Cash or Card at the billing counter"
                      />
                    </div>
                  </div>

                  {/* Order summary */}
                  <div className="bg-muted/50 rounded-xl p-3.5 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Summary</p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div key={item.menuItemId} className="flex justify-between text-sm">
                          <span className="text-foreground truncate mr-2">{item.name} × {item.quantity}</span>
                          <span className="text-muted-foreground flex-shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span><span>₹{subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST (5%)</span><span>₹{tax.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span className="text-primary" data-testid="text-checkout-total">₹{total.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky place order */}
                <div className="flex-shrink-0 border-t border-border px-4 pt-3 pb-5">
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button
                      className="w-full h-12 text-base font-semibold gap-2"
                      onClick={handlePlaceOrder}
                      disabled={createOrder.isPending}
                      data-testid="button-place-order"
                    >
                      {createOrder.isPending ? (
                        "Placing Order..."
                      ) : paymentMethod === "online" ? (
                        <>
                          <Wallet className="h-5 w-5" />
                          Pay ₹{total.toFixed(0)} Online
                        </>
                      ) : (
                        <>
                          <Banknote className="h-5 w-5" />
                          Place Order — Pay at Counter
                        </>
                      )}
                    </Button>
                  </motion.div>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    {paymentMethod === "online"
                      ? "You'll be redirected to Razorpay after placing"
                      : "Pay cash or card when your food arrives"}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
