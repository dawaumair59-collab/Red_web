import { pgTable, text, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tablesTable } from "./tables";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tableId: text("table_id").notNull().references(() => tablesTable.id, { onDelete: "restrict" }),
  tableNumber: integer("table_number").notNull(),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull().$type<Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string | null;
  }>>(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name"),
  specialRequests: text("special_requests"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentMethod: text("payment_method").notNull().default("online"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
