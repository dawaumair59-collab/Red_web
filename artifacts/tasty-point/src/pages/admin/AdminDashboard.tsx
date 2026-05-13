import { TrendingUp, ShoppingBag, Clock, CalendarDays } from "lucide-react";
import { useGetAdminStats, useListRecentOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/OrderStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: recentOrders, isLoading: ordersLoading } = useListRecentOrders();

  if (statsLoading || ordersLoading) return <PageLoader />;

  const STAT_CARDS = [
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Total Revenue", value: `₹${(stats?.totalRevenue ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-green-600" },
    { label: "Pending Orders", value: stats?.pendingOrders ?? 0, icon: Clock, color: "text-yellow-600" },
    { label: "Today Orders", value: stats?.todayOrders ?? 0, icon: CalendarDays, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Restaurant overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1" data-testid={`text-stat-${label.toLowerCase().replace(/ /g, "-")}`}>{value}</p>
                </div>
                <Icon className={`h-5 w-5 ${color} mt-1`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Popular Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.popularItems ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet</p>
            ) : (
              (stats?.popularItems ?? []).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm" data-testid={`row-popular-${i}`}>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.count} orders</p>
                  </div>
                  <p className="font-semibold text-primary">₹{item.revenue.toFixed(2)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats?.ordersByStatus ?? []).map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm" data-testid={`row-status-${row.status}`}>
                <OrderStatusBadge status={row.status} />
                <span className="font-bold">{row.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {(recentOrders ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No orders yet</p>
            ) : (
              (recentOrders ?? []).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between" data-testid={`row-order-${order.id}`}>
                  <div>
                    <p className="text-sm font-medium">Table {order.tableNumber} — #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <span className="text-sm font-bold">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
