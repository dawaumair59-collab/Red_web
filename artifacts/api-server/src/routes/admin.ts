import { Router, type IRouter } from "express";
import { db, ordersTable, menuItemsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

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
    .filter((o) => o.createdAt >= today && o.paymentStatus === "paid")
    .reduce((sum, o) => sum + Number(o.totalAmount), 0);

  const itemCountMap = new Map<string, { name: string; count: number; revenue: number }>();
  for (const order of allOrders) {
    for (const item of (order.items as Array<{ menuItemId: string; name: string; price: number; quantity: number }>)) {
      const existing = itemCountMap.get(item.menuItemId) ?? { name: item.name, count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.price * item.quantity;
      itemCountMap.set(item.menuItemId, existing);
    }
  }
  const popularItems = Array.from(itemCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const statusCounts = new Map<string, number>();
  for (const o of allOrders) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

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

  res.json(orders.map((o) => ({
    id: o.id,
    tableId: o.tableId,
    tableNumber: o.tableNumber,
    status: o.status,
    items: o.items,
    totalAmount: Number(o.totalAmount),
    customerName: o.customerName ?? null,
    specialRequests: o.specialRequests ?? null,
    paymentStatus: o.paymentStatus,
    razorpayOrderId: o.razorpayOrderId ?? null,
    razorpayPaymentId: o.razorpayPaymentId ?? null,
    createdAt: o.createdAt.toISOString(),
  })));
});

export default router;
