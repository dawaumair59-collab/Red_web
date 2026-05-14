import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, ordersTable, tablesTable, menuItemsTable } from "@workspace/db";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { emitOrderCreated, emitOrderUpdated } from "../lib/socket";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const WHATSAPP_TOKEN = process.env["WHATSAPP_ACCESS_TOKEN"] ?? "";
const WHATSAPP_PHONE_ID = process.env["WHATSAPP_PHONE_NUMBER_ID"] ?? "";
const OWNER_PHONE = process.env["OWNER_PHONE_NUMBER"] ?? "";

async function sendWhatsAppNotification(order: {
  id: string;
  tableNumber: number;
  totalAmount: number;
  itemCount: number;
  customerName?: string | null;
}): Promise<void> {
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID || !OWNER_PHONE) return;
  try {
    const message = `🍽️ *New Order — Tasty Point*\n\nTable: *${order.tableNumber}*\nOrder ID: #${order.id.slice(0, 8).toUpperCase()}\nItems: ${order.itemCount}\nTotal: ₹${order.totalAmount.toFixed(0)}${order.customerName ? `\nCustomer: ${order.customerName}` : ""}\n\nCheck admin dashboard to confirm.`;
    await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: OWNER_PHONE,
        type: "text",
        text: { body: message },
      }),
    });
  } catch (err) {
    logger.warn({ err }, "WhatsApp notification failed");
  }
}

router.get("/orders", async (req, res): Promise<void> => {
  const queryParsed = ListOrdersQueryParams.safeParse(req.query);
  if (!queryParsed.success) {
    res.status(400).json({ error: queryParsed.error.message });
    return;
  }
  const { status, tableId } = queryParsed.data;
  const conditions = [];
  if (status) conditions.push(eq(ordersTable.status, status));
  if (tableId) conditions.push(eq(ordersTable.tableId, tableId));

  const orders = conditions.length > 0
    ? await db.select().from(ordersTable).where(and(...conditions)).orderBy(ordersTable.createdAt)
    : await db.select().from(ordersTable).orderBy(ordersTable.createdAt);

  res.json(orders.map(formatOrder));
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, parsed.data.tableId));
  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  const itemIds = parsed.data.items.map((i) => i.menuItemId);
  const menuItems = await db.select().from(menuItemsTable).where(
    itemIds.length === 1
      ? eq(menuItemsTable.id, itemIds[0])
      : eq(menuItemsTable.id, itemIds[0])
  );
  const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

  let totalAmount = 0;
  const orderItems = parsed.data.items.map((item) => {
    const menuItem = menuItemMap.get(item.menuItemId);
    const price = menuItem ? Number(menuItem.price) : 0;
    const name = menuItem ? menuItem.name : "Unknown";
    const imageUrl = menuItem?.imageUrl ?? null;
    totalAmount += price * item.quantity;
    return { menuItemId: item.menuItemId, name, price, quantity: item.quantity, imageUrl };
  });

  const [order] = await db.insert(ordersTable).values({
    tableId: parsed.data.tableId,
    tableNumber: table.number,
    status: "pending",
    items: orderItems,
    totalAmount: String(totalAmount),
    customerName: parsed.data.customerName ?? null,
    specialRequests: parsed.data.specialRequests ?? null,
    paymentStatus: "unpaid",
    paymentMethod: parsed.data.paymentMethod ?? "online",
  }).returning();

  const formatted = formatOrder(order);
  emitOrderCreated(formatted as Record<string, unknown>);

  sendWhatsAppNotification({
    id: order.id,
    tableNumber: order.tableNumber,
    totalAmount,
    itemCount: orderItems.reduce((s, i) => s + i.quantity, 0),
    customerName: order.customerName,
  });

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

router.patch("/orders/:id", async (req, res): Promise<void> => {
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
    .set({ status: parsed.data.status })
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
  };
}

export default router;
