import { pgTable, text, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tableNumber: integer("table_number").notNull(),
  status: text("status").notNull().default("pending"),
  items: jsonb("items").notNull().$type<Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string | null;
  }>>(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  customerName: text("customer_name"),
  specialRequests: text("special_requests"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
