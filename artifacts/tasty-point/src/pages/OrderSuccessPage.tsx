import { useParams } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id) },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-14 w-14 text-green-600" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground">Your order has been confirmed and is being prepared.</p>
        </div>

        {order && (
          <div className="bg-card border border-card-border rounded-xl p-5 w-full max-w-sm space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-mono font-medium">#{order.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Table</span>
              <span className="font-medium">{order.tableNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium">{(order.items as unknown[]).length}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total Paid</span>
              <span className="text-primary" data-testid="text-success-total">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Link href="/">
          <Button variant="outline" className="w-full max-w-sm" data-testid="button-back-home">
            Back to Home
          </Button>
        </Link>
      </main>
    </div>
  );
}
