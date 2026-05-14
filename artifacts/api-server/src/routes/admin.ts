import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalOrders = allOrders.length;
  const totalRevenue = allOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const todayOrders = allOrders.filter((o) => o.createdAt >= today).length;
  const todayRevenue = allOrders
    .filter((o) => o.paymentStatus === "paid" && o.createdAt >= today)
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const statusCounts = new Map<string, number>();
  for (const o of allOrders) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const itemCountMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const o of allOrders) {
    const items = o.items as Array<{ name: string; price: number; quantity: number }>;
    for (const item of items) {
      const existing = itemCountMap.get(item.name);
      if (existing) {
        existing.count += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        itemCountMap.set(item.name, {
          name: item.name,
          count: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    }
  }
  const popularItems = Array.from(itemCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    totalOrders,
    totalRevenue,
    pendingOrders,
    todayOrders,
    todayRevenue,
    popularItems,
    ordersByStatus,
  });
});

router.get("/admin/recent-orders", async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(10);

  res.json(
    orders.map((o) => ({
      id: o.id,
      tableId: o.tableId,
      tableNumber: o.tableNumber,
      status: o.status,
      items: o.items,
      totalAmount: Number(o.totalAmount),
      customerName: o.customerName ?? null,
      specialRequests: o.specialRequests ?? null,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod ?? "online",
      razorpayOrderId: o.razorpayOrderId ?? null,
      razorpayPaymentId: o.razorpayPaymentId ?? null,
      createdAt: o.createdAt.toISOString(),
    }))
  );
});

export default router;
