import { Router, type IRouter } from "express";
import { db, ordersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/admin/stats", async (_req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const activeOrders = allOrders.filter((o) => ["accepted", "preparing", "ready"].includes(o.status)).length;
  const completedToday = allOrders.filter((o) => o.status === "delivered" && o.createdAt >= today).length;

  const statusCounts = new Map<string, number>();
  for (const o of allOrders) {
    statusCounts.set(o.status, (statusCounts.get(o.status) ?? 0) + 1);
  }
  const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }));

  res.json({
    totalOrders,
    pendingOrders,
    activeOrders,
    completedToday,
    ordersByStatus,
  });
});

export default router;
