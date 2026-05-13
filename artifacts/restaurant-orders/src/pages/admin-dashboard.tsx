import React, { useState } from "react";
import {
  useListOrders,
  useGetAdminStats,
  useUpdateOrderStatus,
  getListOrdersQueryKey,
  getGetAdminStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Order, OrderStatusUpdateStatus } from "@workspace/api-client-react";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useNotificationSound } from "@/hooks/useSound";
import ConnectionBadge from "@/components/ConnectionBadge";

function OrderCard({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleUpdate = (newStatus: OrderStatusUpdateStatus, e: React.MouseEvent) => {
    e.preventDefault();
    // Optimistic update
    queryClient.setQueryData<Order[]>(getListOrdersQueryKey(), (old) => {
      if (!old) return old;
      return old.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o));
    });
    updateStatus.mutate(
      { id: order.id, data: { status: newStatus } },
      {
        onError: () => {
          // Revert on error
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
        },
      }
    );
  };

  const statusColor = {
    pending: "border-l-destructive",
    accepted: "border-l-primary",
    preparing: "border-l-yellow-500",
    ready: "border-l-green-500",
    delivered: "border-l-muted",
  }[order.status] ?? "border-l-muted";

  return (
    <Link href={`/admin/orders/${order.id}`}>
      <Card className={`hover:border-primary/50 cursor-pointer transition-all relative overflow-hidden group border-l-4 ${statusColor}`}>
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="font-mono text-lg px-2 py-0.5 font-bold">
                T{order.tableNumber}
              </Badge>
              <Badge
                variant="secondary"
                className={`uppercase text-xs ${order.status === "pending" ? "text-destructive" : order.status === "ready" ? "text-green-400" : ""}`}
              >
                {order.status}
              </Badge>
            </div>
            <div className="text-muted-foreground text-xs font-mono">
              {new Date(order.createdAt).toLocaleTimeString()}
            </div>
          </div>

          <div className="space-y-0.5">
            {order.items.slice(0, 3).map((item) => (
              <div key={item.menuItemId} className="flex text-sm gap-2">
                <span className="text-primary font-mono font-bold shrink-0">{item.quantity}x</span>
                <span className="truncate text-foreground/80">{item.name}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="text-xs text-muted-foreground">+{order.items.length - 3} more items</div>
            )}
          </div>

          <div className="pt-2 border-t flex justify-between items-center">
            <div className="font-mono text-sm font-bold">${order.totalAmount.toFixed(2)}</div>
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {order.status === "pending" && (
                <>
                  <Button size="sm" variant="destructive" disabled={updateStatus.isPending} onClick={(e) => handleUpdate("delivered", e)}>
                    Reject
                  </Button>
                  <Button size="sm" disabled={updateStatus.isPending} onClick={(e) => handleUpdate("accepted", e)}>
                    Accept
                  </Button>
                </>
              )}
              {order.status === "accepted" && (
                <Button size="sm" disabled={updateStatus.isPending} onClick={(e) => handleUpdate("preparing", e)}>
                  Prepare
                </Button>
              )}
              {order.status === "preparing" && (
                <Button size="sm" disabled={updateStatus.isPending} onClick={(e) => handleUpdate("ready", e)}>
                  Ready
                </Button>
              )}
              {order.status === "ready" && (
                <Button size="sm" variant="outline" disabled={updateStatus.isPending} onClick={(e) => handleUpdate("delivered", e)}>
                  Deliver
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { playNewOrderAlert } = useNotificationSound();
  const { status: connectionStatus } = useRealtimeOrders(playNewOrderAlert);

  const { data: stats } = useGetAdminStats({ query: { refetchInterval: 10000 } });
  const { data: orders = [] } = useListOrders(undefined, {
    query: { refetchInterval: 10000 },
  });

  const [filter, setFilter] = useState<string>("active");

  const filteredOrders = orders
    .filter((o) => {
      if (filter === "active") return ["pending", "accepted", "preparing", "ready"].includes(o.status);
      if (filter === "completed") return o.status === "delivered";
      return o.status === filter;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen p-4 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold font-mono uppercase tracking-widest">Kitchen Display</h1>
        <div className="flex items-center gap-4">
          <ConnectionBadge status={connectionStatus} />
          <Link href="/">
            <Button variant="outline" size="sm">Customer View</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <Card className="mb-4">
        <CardContent className="p-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active</div>
            <div className="text-3xl font-mono font-bold">{stats?.activeOrders ?? 0}</div>
          </div>
          <div className="text-center border-x border-border">
            <div className="text-xs uppercase tracking-wider mb-1 text-destructive">Pending</div>
            <div className="text-3xl font-mono font-bold text-destructive">{stats?.pendingOrders ?? 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Done Today</div>
            <div className="text-3xl font-mono font-bold">{stats?.completedToday ?? 0}</div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 shrink-0">
        {["active", "pending", "preparing", "ready", "completed"].map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize shrink-0"
          >
            {f === "active" ? "All Active" : f}
            {f === "pending" && stats?.pendingOrders ? (
              <span className="ml-1.5 bg-destructive text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {stats.pendingOrders}
              </span>
            ) : null}
          </Button>
        ))}
      </div>

      {/* Order Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {filteredOrders.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              No orders for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
