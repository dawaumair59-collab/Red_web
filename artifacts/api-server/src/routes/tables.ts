import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tablesTable } from "@workspace/db";
import { CreateTableBody, DeleteTableParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tables", async (_req, res): Promise<void> => {
  const tables = await db.select().from(tablesTable).orderBy(tablesTable.number);
  res.json(tables.map(formatTable));
});

router.post("/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db.select().from(tablesTable).where(eq(tablesTable.number, parsed.data.number));
  if (existing.length > 0) {
    res.status(409).json({ error: `Table ${parsed.data.number} already exists` });
    return;
  }

  const tempId = crypto.randomUUID();
  const qrCode = `/tasty-point/menu?tableId=${tempId}`;

  const [table] = await db
    .insert(tablesTable)
    .values({ id: tempId, number: parsed.data.number, label: parsed.data.label ?? null, qrCode })
    .returning();
  res.status(201).json(formatTable(table));
});

router.get("/tables/:id", async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [table] = await db.select().from(tablesTable).where(eq(tablesTable.id, params.data.id));
  if (!table) { res.status(404).json({ error: "Table not found" }); return; }
  res.json(formatTable(table));
});

router.patch("/tables/:id", async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = req.body as { label?: string | null };
  const label = body.label === null || body.label === undefined ? null : String(body.label).trim() || null;

  const [table] = await db
    .update(tablesTable)
    .set({ label })
    .where(eq(tablesTable.id, params.data.id))
    .returning();
  if (!table) { res.status(404).json({ error: "Table not found" }); return; }
  res.json(formatTable(table));
});

router.delete("/tables/:id", async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [table] = await db.delete(tablesTable).where(eq(tablesTable.id, params.data.id)).returning();
  if (!table) { res.status(404).json({ error: "Table not found" }); return; }
  res.sendStatus(204);
});

function formatTable(t: typeof tablesTable.$inferSelect) {
  return {
    id: t.id,
    number: t.number,
    qrCode: t.qrCode,
    label: t.label ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

export default router;
