import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { db, ordersTable } from "@workspace/db";
import {
  CreatePaymentOrderBody,
  VerifyPaymentBody,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID ?? "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";

async function createRazorpayOrder(amount: number): Promise<{ id: string; amount: number; currency: string }> {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Razorpay error: ${err}`);
  }
  return response.json() as Promise<{ id: string; amount: number; currency: string }>;
}

router.post("/payments/create-order", async (req, res): Promise<void> => {
  const parsed = CreatePaymentOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  try {
    const rzpOrder = await createRazorpayOrder(Number(order.totalAmount));
    await db.update(ordersTable).set({ razorpayOrderId: rzpOrder.id }).where(eq(ordersTable.id, parsed.data.orderId));
    res.status(201).json({
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create Razorpay order");
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

router.post("/payments/verify", async (req, res): Promise<void> => {
  const parsed = VerifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    res.status(400).json({ success: false, message: "Invalid payment signature" });
    return;
  }

  await db.update(ordersTable).set({
    paymentStatus: "paid",
    razorpayPaymentId,
    status: "confirmed",
  }).where(eq(ordersTable.id, orderId));

  res.json({ success: true, message: "Payment verified successfully" });
});

export default router;
