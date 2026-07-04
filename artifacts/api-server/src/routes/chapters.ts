import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, chaptersTable } from "@workspace/db";

const router = Router();

router.get("/chapters/:id", async (req, res) => {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, req.params.id));
  if (!chapter) { res.status(404).json({ error: "Chapter not found" }); return; }
  res.json(chapter);
});

export default router;
