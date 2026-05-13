import React, { useEffect, useRef, useState } from "react";
import { useListOrders, useGetAdminStats, useUpdateOrderStatus, getListOrdersQueryKey, getGetAdminStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Order, OrderStatusUpdateStatus } from "@workspace/api-client-react";

function OrderCard({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleUpdate = (newStatus: OrderStatusUpdateStatus, e: React.MouseEvent) => {
    e.preventDefault(); // prevent link click
    updateStatus.mutate({ id: order.id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminStatsQueryKey() });
      }
    });
  };

  return (
    <Link href={`/admin/orders/${order.id}`}>
      <Card className="hover:border-primary/50 cursor-pointer transition-colors relative overflow-hidden group">
        <div className={`absolute top-0 left-0 w-1 h-full ${order.status === 'pending' ? 'bg-destructive' : order.status === 'ready' ? 'bg-green-500' : 'bg-primary'}`} />
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="flex gap-2 items-center">
              <Badge variant="outline" className="font-mono text-lg px-2 py-0.5">T{order.tableNumber}</Badge>
              <Badge variant="secondary" className="uppercase text-xs">{order.status}</Badge>
            </div>
            <div className="text-muted-foreground text-xs font-mono">{new Date(order.createdAt).toLocaleTimeString()}</div>
          </div>
          
          <div className="space-y-1">
            {order.items.slice(0, 3).map(item => (
              <div key={item.menuItemId} className="flex justify-between text-sm">
                <span className="truncate pr-2"><span className="text-muted-foreground font-mono mr-1">{item.quantity}x</span>{item.name}</span>
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="text-xs text-muted-foreground">+{order.items.length - 3} more items</div>
            )}
          </div>

          <div className="pt-2 border-t flex justify-between items-center mt-auto">
            <div className="font-mono text-sm">${order.totalAmount.toFixed(2)}</div>
            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              {order.status === 'pending' && (
                <>
                  <Button size="sm" variant="destructive" onClick={(e) => handleUpdate('delivered', e)}>Reject</Button>
                  <Button size="sm" onClick={(e) => handleUpdate('accepted', e)}>Accept</Button>
                </>
              )}
              {order.status === 'accepted' && (
                <Button size="sm" onClick={(e) => handleUpdate('preparing', e)}>Prepare</Button>
              )}
              {order.status === 'preparing' && (
                <Button size="sm" onClick={(e) => handleUpdate('ready', e)}>Ready</Button>
              )}
              {order.status === 'ready' && (
                <Button size="sm" variant="outline" onClick={(e) => handleUpdate('delivered', e)}>Deliver</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: stats } = useGetAdminStats({ query: { refetchInterval: 3000 } });
  const { data: orders = [] } = useListOrders(undefined, { query: { refetchInterval: 3000 } });
  const [filter, setFilter] = useState<string>("active");
  const previousPendingCount = useRef<number>(0);

  useEffect(() => {
    const currentPending = orders.filter(o => o.status === 'pending').length;
    if (currentPending > previousPendingCount.current) {
      // Play beep
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      } catch (e) {
        // ignore audio context errors
      }
    }
    previousPendingCount.current = currentPending;
  }, [orders]);

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return ['pending', 'accepted', 'preparing', 'ready'].includes(o.status);
    if (filter === 'completed') return o.status === 'delivered';
    return o.status === filter;
  });

  return (
    <div className="min-h-screen p-4 flex flex-col h-screen overflow-hidden">
      <div className="flex gap-4 mb-6">
        <Card className="flex-1 bg-card">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Active</div>
              <div className="text-3xl font-mono font-bold">{stats?.activeOrders || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider text-destructive">Pending</div>
              <div className="text-3xl font-mono font-bold text-destructive">{stats?.pendingOrders || 0}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground uppercase tracking-wider">Completed</div>
              <div className="text-3xl font-mono font-bold">{stats?.completedToday || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 shrink-0">
        <Button variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>Active Orders</Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')}>Pending</Button>
        <Button variant={filter === 'preparing' ? 'default' : 'outline'} onClick={() => setFilter('preparing')}>Preparing</Button>
        <Button variant={filter === 'ready' ? 'default' : 'outline'} onClick={() => setFilter('ready')}>Ready</Button>
        <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>Completed</Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
          {filteredOrders.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No orders found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
