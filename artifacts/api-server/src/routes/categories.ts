import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.userId, req.userId));
    res.json(rows.map((r) => r.name));
  } catch (err) {
    req.log.error(err, "Failed to fetch categories");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: "Name required" });
      return;
    }
    await db
      .insert(categoriesTable)
      .values({ userId: req.userId, name: name.trim() })
      .onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Failed to create category");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:name", requireAuth, async (req, res) => {
  try {
    await db
      .delete(categoriesTable)
      .where(
        and(
          eq(categoriesTable.name, req.params.name),
          eq(categoriesTable.userId, req.userId),
        ),
      );
    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Failed to delete category");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
