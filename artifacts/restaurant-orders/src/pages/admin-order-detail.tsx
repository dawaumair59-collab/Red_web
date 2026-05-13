import { useGetOrder, useUpdateOrderStatus, getGetOrderQueryKey, getListOrdersQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { useRealtimeOrder } from "@/hooks/useRealtimeOrders";
import { useNotificationSound } from "@/hooks/useSound";
import ConnectionBadge from "@/components/ConnectionBadge";

const STATUS_STEPS = ["pending", "accepted", "preparing", "ready", "delivered"] as const;

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id || "";
  const { data: order, isLoading } = useGetOrder(id, {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(id), refetchInterval: 15000 },
  });
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();
  const { status: connectionStatus } = useRealtimeOrder(id);
  const { playStatusChangeSound } = useNotificationSound();

  const handleUpdate = (newStatus: OrderStatusUpdateStatus) => {
    if (!order) return;
    // Optimistic update
    const optimistic = { ...order, status: newStatus };
    queryClient.setQueryData(getGetOrderQueryKey(id), optimistic);

    updateStatus.mutate(
      { id, data: { status: newStatus } },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetOrderQueryKey(id), updated);
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
          playStatusChangeSound();
        },
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
        },
      }
    );
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground font-mono">Loading order...</div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);

  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">Back</Button>
          </Link>
          <h1 className="text-xl font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</h1>
        </div>
        <ConnectionBadge status={connectionStatus} />
      </div>

      {/* Status Timeline */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-4 w-full h-0.5 bg-muted -z-0" />
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isActive = idx === currentStepIdx;
              return (
                <div key={step} className="flex flex-col items-center gap-2 z-10 bg-card px-1">
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      isCompleted
                        ? "bg-primary border-primary"
                        : "bg-muted border-muted-foreground/30"
                    } ${isActive ? "ring-4 ring-primary/20 scale-125" : ""}`}
                  />
                  <span
                    className={`text-xs capitalize font-mono ${
                      isCompleted ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-sm uppercase tracking-wider">Order Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start p-4 border-b border-border/50 last:border-0"
                >
                  <div className="flex gap-3 items-start">
                    <div className="font-mono text-xl font-bold text-primary bg-primary/10 w-10 h-10 flex items-center justify-center rounded">
                      {item.quantity}
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.notes && (
                        <div className="text-xs text-destructive mt-0.5">Note: {item.notes}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        ${item.price.toFixed(2)} each
                      </div>
                    </div>
                  </div>
                  <div className="font-mono font-bold">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.specialRequests && (
            <Card className="border-destructive/50">
              <CardHeader className="py-3 px-4 bg-destructive/10">
                <CardTitle className="text-sm uppercase tracking-wider text-destructive">
                  Special Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm">{order.specialRequests}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Table</div>
                <div className="text-5xl font-mono font-bold">{order.tableNumber}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
                <Badge variant="secondary" className="text-base uppercase px-3 py-1">
                  {order.status}
                </Badge>
              </div>
              {order.customerName && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Customer</div>
                  <div className="font-medium">{order.customerName}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</div>
                <div className="text-2xl font-mono font-bold text-primary">
                  ${order.totalAmount.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Placed</div>
                <div className="text-sm font-mono">{new Date(order.createdAt).toLocaleTimeString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {order.status === "pending" && (
              <>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={updateStatus.isPending}
                  onClick={() => handleUpdate("accepted")}
                >
                  ACCEPT ORDER
                </Button>
                <Button
                  size="lg"
                  variant="destructive"
                  className="w-full"
                  disabled={updateStatus.isPending}
                  onClick={() => handleUpdate("delivered")}
                >
                  REJECT ORDER
                </Button>
              </>
            )}
            {order.status === "accepted" && (
              <Button
                size="lg"
                className="w-full"
                disabled={updateStatus.isPending}
                onClick={() => handleUpdate("preparing")}
              >
                START PREPARING
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                size="lg"
                className="w-full"
                disabled={updateStatus.isPending}
                onClick={() => handleUpdate("ready")}
              >
                MARK AS READY
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                disabled={updateStatus.isPending}
                onClick={() => handleUpdate("delivered")}
              >
                COMPLETE DELIVERY
              </Button>
            )}
            {order.status === "delivered" && (
              <div className="text-center text-muted-foreground text-sm font-mono py-2">
                Order completed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
