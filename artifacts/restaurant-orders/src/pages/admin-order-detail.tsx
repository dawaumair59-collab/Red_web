import React from "react";
import { useGetOrder, useUpdateOrderStatus, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { OrderStatusUpdateStatus } from "@workspace/api-client-react";

export default function AdminOrderDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id || "";
  const { data: order, isLoading } = useGetOrder(id, { query: { enabled: !!id, queryKey: getGetOrderQueryKey(id), refetchInterval: 3000 } });
  const updateStatus = useUpdateOrderStatus();
  const queryClient = useQueryClient();

  const handleUpdate = (newStatus: OrderStatusUpdateStatus) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(id) });
      }
    });
  };

  if (isLoading || !order) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen p-4 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
        <h1 className="text-2xl font-bold font-mono">ORDER #{order.id.slice(0, 8)}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center py-4 border-b">
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div className="flex gap-4">
                    <div className="font-mono text-xl text-primary bg-primary/10 px-3 py-1 rounded">
                      {item.quantity}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{item.name}</div>
                      {item.notes && <div className="text-sm text-destructive mt-1">Note: {item.notes}</div>}
                    </div>
                  </div>
                  <div className="font-mono">${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          {order.specialRequests && (
            <Card className="border-destructive">
              <CardHeader className="py-3 bg-destructive/10 text-destructive">
                <CardTitle className="text-sm uppercase tracking-wider">Special Requests</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p>{order.specialRequests}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Table Number</div>
                <div className="text-6xl font-mono font-bold">{order.tableNumber}</div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Status</div>
                <Badge variant="secondary" className="text-lg uppercase px-4 py-1">{order.status}</Badge>
              </div>

              <div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Total Amount</div>
                <div className="text-3xl font-mono font-bold text-primary">${order.totalAmount.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3">
            {order.status === 'pending' && (
              <>
                <Button size="lg" className="w-full text-lg" onClick={() => handleUpdate('accepted')}>ACCEPT ORDER</Button>
                <Button size="lg" variant="destructive" className="w-full" onClick={() => handleUpdate('delivered')}>REJECT ORDER</Button>
              </>
            )}
            {order.status === 'accepted' && (
              <Button size="lg" className="w-full text-lg" onClick={() => handleUpdate('preparing')}>START PREPARING</Button>
            )}
            {order.status === 'preparing' && (
              <Button size="lg" className="w-full text-lg" onClick={() => handleUpdate('ready')}>MARK AS READY</Button>
            )}
            {order.status === 'ready' && (
              <Button size="lg" className="w-full text-lg" variant="outline" onClick={() => handleUpdate('delivered')}>COMPLETE DELIVERY</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
