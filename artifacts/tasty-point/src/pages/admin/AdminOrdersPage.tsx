import { useState } from "react";
import { useListOrders, getListOrdersQueryKey, useUpdateOrderStatus } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const STATUS_TABS = ["all", "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];

const NEXT_STATUS: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivered",
};

const NEXT_LABEL: Record<string, string> = {
  pending: "Confirm",
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Mark Delivered",
};

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const params = activeTab === "all" ? {} : { status: activeTab as "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" };
  const { data: orders, isLoading } = useListOrders(params, {
    query: { queryKey: getListOrdersQueryKey(params) },
  });
  const updateStatus = useUpdateOrderStatus();

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateStatus.mutate(
      { id: orderId, data: { status: newStatus as "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey(params) });
          toast({ title: "Order status updated" });
        },
        onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted-foreground text-sm">Manage and track all orders</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto bg-muted p-1">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize text-xs" data-testid={`tab-${tab}`}>
              {tab === "all" ? "All" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <PageLoader />
          ) : (orders ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders found</div>
          ) : (
            <div className="space-y-3">
              {[...(orders ?? [])].reverse().map((order) => (
                <div key={order.id} className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm" data-testid={`card-order-${order.id}`}>
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-sm">Table {order.tableNumber}</p>
                      <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <OrderStatusBadge status={order.status} />
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </div>
                  </div>

                  <div className="px-4 py-2 space-y-1">
                    {(order.items as Array<{ name: string; quantity: number; price: number }>).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{item.name} x{item.quantity}</span>
                        <span className="text-muted-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <span className="font-bold text-primary" data-testid={`text-total-${order.id}`}>₹{order.totalAmount.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      {NEXT_STATUS[order.status] && (
                        <Button
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleStatusUpdate(order.id, NEXT_STATUS[order.status])}
                          disabled={updateStatus.isPending}
                          data-testid={`button-next-status-${order.id}`}
                        >
                          {NEXT_LABEL[order.status]}
                        </Button>
                      )}
                      {order.status !== "cancelled" && order.status !== "delivered" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8 border-destructive text-destructive hover:bg-destructive hover:text-white"
                          onClick={() => handleStatusUpdate(order.id, "cancelled")}
                          disabled={updateStatus.isPending}
                          data-testid={`button-cancel-${order.id}`}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
