import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ShoppingBag, Clock, CalendarDays, Users,
  ArrowUpRight, Utensils, RefreshCw, CheckCircle2, AlertCircle,
} from "lucide-react";
import {
  useGetAdminStats, useListOrders, useUpdateOrderStatus, getListOrdersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { PageLoader } from "@/components/LoadingSpinner";

// ── Theme ─────────────────────────────────────────────────────────────────────
const RED = "#dc2626";
const RED_LIGHT = "#fca5a5";
const PALETTE = [RED, "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

const STATUS_HEX: Record<string, string> = {
  pending: "#eab308", confirmed: "#3b82f6", preparing: "#f97316",
  ready: "#22c55e", delivered: "#6b7280", cancelled: "#dc2626",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 truncate ${accent ? "text-primary" : "text-foreground"}`}>
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Responsive table wrapper ──────────────────────────────────────────────────
function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {headers.map((h) => (
              <th
                key={h}
                className={`px-4 py-3 font-medium text-muted-foreground ${h === "#" || h === "Rank" ? "w-10" : ""} ${["Total", "Revenue", "Orders", "Avg/Order", "Action", "Time", "Avg"].includes(h) ? "text-right" : "text-left"}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [revenueRange, setRevenueRange] = useState<"7" | "14" | "30">("7");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = useGetAdminStats();
  const { data: allOrders = [], isLoading: ordersLoading } = useListOrders({});
  const updateStatus = useUpdateOrderStatus();

  if (statsLoading || ordersLoading) return <PageLoader />;

  // ── Derived data ────────────────────────────────────────────────────────────
  const totalRevenue = allOrders.reduce((s, o) => s + Number(o.totalAmount), 0);
  const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
  const pendingOrders = allOrders.filter((o) => o.status === "pending");

  const revenueByDay = (() => {
    const days = parseInt(revenueRange);
    const map: Record<string, number> = {};
    const now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 864e5);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    allOrders.forEach((o) => {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (key in map) map[key] = (map[key] || 0) + Number(o.totalAmount);
    });
    return Object.entries(map).map(([date, revenue]) => ({
      date: shortDate(date + "T00:00:00"),
      revenue: Math.round(revenue),
    }));
  })();

  const peakHours = (() => {
    const h: Record<number, { orders: number; revenue: number }> = {};
    for (let i = 8; i <= 23; i++) h[i] = { orders: 0, revenue: 0 };
    allOrders.forEach((o) => {
      const hr = new Date(o.createdAt).getHours();
      if (hr >= 8 && hr <= 23) {
        h[hr].orders++;
        h[hr].revenue += Number(o.totalAmount);
      }
    });
    const maxOrders = Math.max(...Object.values(h).map((v) => v.orders), 1);
    return Object.entries(h).map(([hr, v]) => ({
      hour: `${hr.padStart(2, "0")}:00`,
      orders: v.orders,
      revenue: Math.round(v.revenue),
      isPeak: v.orders === maxOrders && v.orders > 0,
    }));
  })();

  const tableStats = (() => {
    const map: Record<number, { orders: number; revenue: number }> = {};
    allOrders.forEach((o) => {
      if (!map[o.tableNumber]) map[o.tableNumber] = { orders: 0, revenue: 0 };
      map[o.tableNumber].orders++;
      map[o.tableNumber].revenue += Number(o.totalAmount);
    });
    return Object.entries(map)
      .map(([t, v]) => ({ table: `T${t}`, num: Number(t), ...v }))
      .sort((a, b) => b.orders - a.orders);
  })();

  const statusPie = (stats?.ordersByStatus ?? []).map((r) => ({
    name: r.status, value: r.count,
  }));

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  const NEXT_STATUS: Record<string, string> = {
    pending: "confirmed", confirmed: "preparing", preparing: "ready", ready: "delivered",
  };
  const NEXT_LABEL: Record<string, string> = {
    pending: "Confirm", confirmed: "Prepare", preparing: "Ready", ready: "Deliver",
  };

  const handleUpdate = (id: string, status: string) => {
    updateStatus.mutate(
      { id, data: { status: status as "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
          toast({ title: "Order updated" });
        },
        onError: () => toast({ title: "Failed", variant: "destructive" }),
      }
    );
  };

  const peakHour = peakHours.find((h) => h.isPeak);
  const maxTableOrders = tableStats[0]?.orders ?? 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Tasty Point — complete restaurant intelligence</p>
        </div>
        <Button
          variant="outline" size="sm" className="self-start gap-2"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({}) });
            toast({ title: "Refreshed" });
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* Pending alert */}
      {pendingOrders.length > 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800 font-medium">
            {pendingOrders.length} pending order{pendingOrders.length > 1 ? "s" : ""} awaiting confirmation
          </p>
          <Button
            size="sm" variant="outline"
            className="ml-auto border-yellow-300 text-yellow-800 hover:bg-yellow-100 shrink-0"
            onClick={() => setActiveTab("orders")}
          >
            View Orders
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-0.5 bg-muted p-1">
          {[
            { value: "overview", label: "Overview" },
            { value: "orders", label: "Orders" },
            { value: "revenue", label: "Revenue" },
            { value: "best-sellers", label: "Best Sellers" },
            { value: "peak-hours", label: "Peak Hours" },
            { value: "tables", label: "Tables" },
          ].map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="text-xs sm:text-sm px-3">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════════════════════════════ OVERVIEW ══════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6 mt-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${allOrders.length} orders`} icon={TrendingUp} accent />
            <KpiCard label="Today's Orders" value={stats?.todayOrders ?? 0} sub="placed today" icon={CalendarDays} />
            <KpiCard label="Pending" value={stats?.pendingOrders ?? 0} sub="need action" icon={Clock} />
            <KpiCard label="Avg Order" value={fmt(avgOrderValue)} sub="per order" icon={ShoppingBag} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sparkline */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-base">Revenue — Last 7 Days</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={revenueByDay.slice(-7)} margin={{ left: 4, right: 4 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={RED} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={RED} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={55} />
                    <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" stroke={RED} fill="url(#g1)" strokeWidth={2} dot={{ r: 3, fill: RED }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Pie */}
            <Card className="shadow-sm">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-base">Order Status Mix</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                      {statusPie.map((e, i) => (
                        <Cell key={i} fill={STATUS_HEX[e.name] ?? PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" formatter={(v) => <span className="text-xs capitalize">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent orders table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-base">Recent Orders</CardTitle>
              <CardDescription>Latest activity across all tables</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable headers={["Order ID", "Table", "Status", "Items", "Total", "Time"]}>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-bold">T{o.tableNumber}</Badge>
                    </td>
                    <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px] truncate">
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{fmt(Number(o.totalAmount))}</td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════ ORDERS ════════════════════════════════ */}
        <TabsContent value="orders" className="space-y-6 mt-5">
          {/* Status chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(stats?.ordersByStatus ?? []).map((row) => (
              <Card key={row.status} className="shadow-sm text-center">
                <CardContent className="p-4">
                  <div className="w-2.5 h-2.5 rounded-full mx-auto mb-2" style={{ backgroundColor: STATUS_HEX[row.status] ?? "#888" }} />
                  <p className="text-2xl font-bold">{row.count}</p>
                  <p className="text-xs text-muted-foreground capitalize mt-0.5">{row.status}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pending quick actions */}
          {pendingOrders.length > 0 && (
            <Card className="shadow-sm border-yellow-200">
              <CardHeader className="pb-3 pt-4 px-5">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  Quick Actions — Pending Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingOrders.map((o) => (
                  <div key={o.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-yellow-50/60">
                    <div>
                      <p className="font-medium text-sm">Table {o.tableNumber} — #{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </p>
                      <p className="text-xs font-bold text-primary mt-1">{fmt(Number(o.totalAmount))}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="destructive" disabled={updateStatus.isPending}
                        onClick={() => handleUpdate(o.id, "cancelled")}>
                        Reject
                      </Button>
                      <Button size="sm" disabled={updateStatus.isPending}
                        onClick={() => handleUpdate(o.id, "confirmed")}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Full orders table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-base">All Orders ({allOrders.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable headers={["ID", "Table", "Items", "Status", "Total", "Date", "Action"]}>
                {[...allOrders]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((o) => {
                    const next = NEXT_STATUS[o.status];
                    return (
                      <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="font-bold">T{o.tableNumber}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                          {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        </td>
                        <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
                        <td className="px-4 py-3 text-right font-semibold text-primary">{fmt(Number(o.totalAmount))}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                          {shortDate(o.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {next ? (
                            <Button size="sm" variant="outline" className="text-xs h-7"
                              disabled={updateStatus.isPending}
                              onClick={() => handleUpdate(o.id, next)}>
                              {NEXT_LABEL[o.status]}
                            </Button>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      </tr>
                    );
                  })}
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════ REVENUE ═══════════════════════════════ */}
        <TabsContent value="revenue" className="space-y-6 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total Revenue" value={fmt(totalRevenue)} icon={TrendingUp} accent />
            <KpiCard label="Avg Order Value" value={fmt(avgOrderValue)} icon={ShoppingBag} />
            <KpiCard label="Total Orders" value={allOrders.length} icon={CalendarDays} />
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Revenue Over Time</CardTitle>
                  <CardDescription>Daily revenue from all orders</CardDescription>
                </div>
                <Select value={revenueRange} onValueChange={(v) => setRevenueRange(v as "7" | "14" | "30")}>
                  <SelectTrigger className="w-36 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="14">Last 14 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueByDay} margin={{ left: 4, right: 4 }}>
                  <defs>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RED} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={60} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                  <Area type="monotone" dataKey="revenue" stroke={RED} fill="url(#g2)" strokeWidth={2.5} dot={{ r: 3, fill: RED }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-base">Revenue Bars</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenueByDay} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={60} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                  <Bar dataKey="revenue" name="Revenue" fill={RED} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ BEST SELLERS ══════════════════════════════ */}
        <TabsContent value="best-sellers" className="space-y-6 mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-base">Top Items by Order Volume</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={(stats?.popularItems ?? []).slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 8, right: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip />
                    <Bar dataKey="count" name="Orders" radius={[0, 4, 4, 0]}>
                      {(stats?.popularItems ?? []).slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-base">Top Items by Revenue</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={(stats?.popularItems ?? []).slice(0, 8).sort((a, b) => b.revenue - a.revenue)}
                    layout="vertical"
                    margin={{ left: 8, right: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
                    <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                    <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]}>
                      {(stats?.popularItems ?? []).slice(0, 8).map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Ranked table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-base">Best Sellers Leaderboard</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable headers={["Rank", "Item", "Orders", "Revenue", "Avg/Order"]}>
                {(stats?.popularItems ?? []).map((item, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex w-6 h-6 rounded-full items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-right">{item.count}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{fmt(item.revenue)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {item.count > 0 ? fmt(item.revenue / item.count) : "—"}
                    </td>
                  </tr>
                ))}
                {(stats?.popularItems ?? []).length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">No data yet — place some orders first</td></tr>
                )}
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ PEAK HOURS ════════════════════════════════ */}
        <TabsContent value="peak-hours" className="space-y-6 mt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Peak Hour"
              value={peakHour?.hour ?? "—"}
              sub={peakHour ? `${peakHour.orders} orders` : "no data"}
              icon={TrendingUp}
              accent
            />
            <KpiCard
              label="Peak Revenue Hour"
              value={peakHours.reduce((a, b) => a.revenue >= b.revenue ? a : b, { hour: "—", revenue: 0, orders: 0, isPeak: false }).hour}
              sub={fmt(Math.max(...peakHours.map((h) => h.revenue), 0))}
              icon={ArrowUpRight}
            />
            <KpiCard
              label="Total Hours Active"
              value={peakHours.filter((h) => h.orders > 0).length}
              sub="hours with orders"
              icon={Clock}
            />
          </div>

          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-base">Orders by Hour</CardTitle>
              <CardDescription>Volume distribution from 8 AM to 11 PM</CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakHours} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                  <Tooltip />
                  <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                    {peakHours.map((h, i) => (
                      <Cell key={i} fill={h.isPeak ? RED : RED_LIGHT} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-center text-muted-foreground mt-2">
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ backgroundColor: RED }} />
                Peak hour &nbsp;
                <span className="inline-block w-3 h-3 rounded-sm mr-1 align-middle" style={{ backgroundColor: RED_LIGHT }} />
                Other hours
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-1 pt-4 px-5">
              <CardTitle className="text-base">Revenue by Hour</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={peakHours} margin={{ left: 4, right: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={55} />
                  <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                  <Bar dataKey="revenue" name="Revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════ TABLE ANALYTICS ═══════════════════════════ */}
        <TabsContent value="tables" className="space-y-6 mt-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <KpiCard label="Tables w/ Orders" value={tableStats.length} sub="unique tables" icon={Users} />
            <KpiCard
              label="Busiest Table"
              value={tableStats[0] ? `T${tableStats[0].num}` : "—"}
              sub={tableStats[0] ? `${tableStats[0].orders} orders` : ""}
              icon={Utensils}
              accent
            />
            <KpiCard
              label="Top Table Revenue"
              value={tableStats[0] ? fmt(tableStats[0].revenue) : "—"}
              sub={tableStats[0] ? `Table ${tableStats[0].num}` : ""}
              icon={TrendingUp}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-base">Orders per Table</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tableStats} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="table" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={30} />
                    <Tooltip />
                    <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                      {tableStats.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-1 pt-4 px-5">
                <CardTitle className="text-base">Revenue per Table</CardTitle>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={tableStats} margin={{ left: 4, right: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="table" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} width={55} />
                    <Tooltip formatter={(v: number) => [fmt(v), "Revenue"]} />
                    <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]}>
                      {tableStats.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Table utilization cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {tableStats.map((t, i) => (
              <Card key={t.table} className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                    >
                      {t.table}
                    </div>
                    <Badge variant="secondary" className="text-xs">{t.orders} orders</Badge>
                  </div>
                  <p className="text-lg font-bold text-foreground">{fmt(t.revenue)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avg {t.orders > 0 ? fmt(t.revenue / t.orders) : "—"} / order
                  </p>
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${maxTableOrders > 0 ? (t.orders / maxTableOrders) * 100 : 0}%`,
                        backgroundColor: PALETTE[i % PALETTE.length],
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
            {tableStats.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No table data yet — orders will appear here
              </div>
            )}
          </div>

          {/* Detail table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-base">Table Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable headers={["Table", "Orders", "Revenue", "Avg", "Utilisation"]}>
                {tableStats.map((t, i) => (
                  <tr key={t.table} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="font-bold" style={{ borderColor: PALETTE[i % PALETTE.length], color: PALETTE[i % PALETTE.length] }}>
                        {t.table}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{t.orders}</td>
                    <td className="px-4 py-3 text-right font-semibold text-primary">{fmt(t.revenue)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {t.orders > 0 ? fmt(t.revenue / t.orders) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${maxTableOrders > 0 ? (t.orders / maxTableOrders) * 100 : 0}%`,
                              backgroundColor: PALETTE[i % PALETTE.length],
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {maxTableOrders > 0 ? Math.round((t.orders / maxTableOrders) * 100) : 0}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </DataTable>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
