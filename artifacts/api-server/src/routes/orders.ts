import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { emitOrderCreated, emitOrderUpdated } from "../lib/socket";

const router: IRouter = Router();

router.get("/orders", async (req, res): Promise<void> => {
  const queryParsed = ListOrdersQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }
  const { status, tableNumber } = queryParsed.data;
  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (tableNumber) conditions.push(eq(ordersTable.tableNumber, tableNumber));

  const orders = conditions.length > 0
    ? await db.select().from(ordersTable).where(and(...conditions))
    : await db.select().from(ordersTable);

  res.json(orders.map(formatOrder));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { tableNumber, customerName, specialRequests, items } = parsed.data;

  let totalAmount = 0;
  const orderItems = items.map((item) => {
    totalAmount += item.price * item.quantity;
    return {
      menuItemId: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      notes: item.notes ?? null,
    };
  });

  const [order] = await db.insert(ordersTable).values({
    tableNumber,
    status: "pending",
    items: orderItems,
    totalAmount: String(totalAmount),
    customerName: customerName ?? null,
    specialRequests: specialRequests ?? null,
  }).returning();

  const formatted = formatOrder(order);
  emitOrderCreated(formatted as Record<string, unknown>);

  res.status(201).json(formatted);
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(formatOrder(order));
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(eq(ordersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  const formatted = formatOrder(order);
  emitOrderUpdated(formatted as Record<string, unknown>);

  res.json(formatted);
});

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    id: o.id,
    tableNumber: o.tableNumber,
    status: o.status,
    items: o.items,
    totalAmount: Number(o.totalAmount),
    customerName: o.customerName ?? null,
    specialRequests: o.specialRequests ?? null,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}

export default router;
