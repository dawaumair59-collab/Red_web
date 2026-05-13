import { useMemo } from "react";
import { QrCode, TrendingUp, ShoppingBag } from "lucide-react";
import { useListOrders } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/LoadingSpinner";

const PALETTE = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function AdminTablesPage() {
  const { data: orders = [], isLoading } = useListOrders({});

  const tableStats = useMemo(() => {
    const map: Record<number, { orders: number; revenue: number; lastOrder: string | null; active: number }> = {};
    orders.forEach((o) => {
      const t = o.tableNumber;
      if (!map[t]) map[t] = { orders: 0, revenue: 0, lastOrder: null, active: 0 };
      map[t].orders++;
      map[t].revenue += Number(o.totalAmount);
      if (!map[t].lastOrder || new Date(o.createdAt) > new Date(map[t].lastOrder!)) {
        map[t].lastOrder = o.createdAt;
      }
      if (["pending", "confirmed", "preparing", "ready"].includes(o.status)) {
        map[t].active++;
      }
    });
    return Object.entries(map)
      .map(([num, v]) => ({ num: Number(num), ...v }))
      .sort((a, b) => b.orders - a.orders);
  }, [orders]);

  const maxOrders = tableStats[0]?.orders ?? 1;

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tables</h1>
        <p className="text-muted-foreground text-sm">
          {tableStats.length} table{tableStats.length !== 1 ? "s" : ""} with order history
        </p>
      </div>

      {tableStats.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <QrCode className="h-14 w-14 text-muted-foreground/30 mx-auto" />
          <p className="font-semibold text-muted-foreground">No table data yet</p>
          <p className="text-sm text-muted-foreground">Table analytics will appear here as orders are placed</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Tables Active</p>
                  <p className="text-2xl font-bold mt-1">{tableStats.length}</p>
                </div>
                <QrCode className="h-5 w-5 text-primary mt-0.5" />
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Busiest Table</p>
                  <p className="text-2xl font-bold mt-1 text-primary">T{tableStats[0].num}</p>
                  <p className="text-xs text-muted-foreground">{tableStats[0].orders} orders</p>
                </div>
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
              </CardContent>
            </Card>
            <Card className="shadow-sm col-span-2 sm:col-span-1">
              <CardContent className="p-4 flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Top Revenue</p>
                  <p className="text-2xl font-bold mt-1 text-primary">
                    ₹{Math.max(...tableStats.map((t) => t.revenue)).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">T{[...tableStats].sort((a, b) => b.revenue - a.revenue)[0]?.num}</p>
                </div>
                <ShoppingBag className="h-5 w-5 text-primary mt-0.5" />
              </CardContent>
            </Card>
          </div>

          {/* Table grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tableStats.map((t, i) => (
              <Card key={t.num} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    >
                      T{t.num}
                    </div>
                    {t.active > 0 && (
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                        {t.active} active
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Orders</span>
                      <span className="font-semibold">{t.orders}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Revenue</span>
                      <span className="font-semibold text-primary">
                        ₹{t.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Avg</span>
                      <span className="font-semibold">
                        ₹{t.orders > 0 ? (t.revenue / t.orders).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Utilisation bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(t.orders / maxOrders) * 100}%`,
                          backgroundColor: PALETTE[i % PALETTE.length],
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-right">
                      {Math.round((t.orders / maxOrders) * 100)}% of peak
                    </p>
                  </div>

                  {t.lastOrder && (
                    <p className="text-[11px] text-muted-foreground mt-2 truncate">
                      Last: {new Date(t.lastOrder).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Table Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Table</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Orders</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Revenue</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Avg/Order</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Active</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Last Order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tableStats.map((t, i) => (
                      <tr key={t.num} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className="font-bold"
                            style={{ borderColor: PALETTE[i % PALETTE.length], color: PALETTE[i % PALETTE.length] }}
                          >
                            T{t.num}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{t.orders}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">
                          ₹{t.revenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          ₹{t.orders > 0 ? (t.revenue / t.orders).toLocaleString("en-IN", { maximumFractionDigits: 0 }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {t.active > 0 ? (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">{t.active}</Badge>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {t.lastOrder
                            ? new Date(t.lastOrder).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
