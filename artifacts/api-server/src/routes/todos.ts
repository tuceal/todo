import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, todosTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(todosTable)
      .where(eq(todosTable.userId, req.userId));
    res.json(rows);
  } catch (err) {
    req.log.error(err, "Failed to fetch todos");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { id, text, done, createdAt, category, dueDate, priority } = req.body;
    const [row] = await db
      .insert(todosTable)
      .values({
        id,
        userId: req.userId,
        text,
        done: done ?? false,
        createdAt,
        category: category ?? null,
        dueDate: dueDate ?? null,
        priority: priority ?? null,
      })
      .onConflictDoUpdate({
        target: todosTable.id,
        set: { text, done: done ?? false, category: category ?? null, dueDate: dueDate ?? null, priority: priority ?? null },
      })
      .returning();
    res.json(row);
  } catch (err) {
    req.log.error(err, "Failed to create todo");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { text, done, category, dueDate, priority } = req.body;
    await db
      .update(todosTable)
      .set({
        ...(text !== undefined && { text }),
        ...(done !== undefined && { done }),
        ...(category !== undefined && { category: category ?? null }),
        ...(dueDate !== undefined && { dueDate: dueDate ?? null }),
        ...(priority !== undefined && { priority: priority ?? null }),
      })
      .where(
        and(
          eq(todosTable.id, req.params.id),
          eq(todosTable.userId, req.userId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Failed to update todo");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db
      .delete(todosTable)
      .where(
        and(
          eq(todosTable.id, req.params.id),
          eq(todosTable.userId, req.userId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Failed to delete todo");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
