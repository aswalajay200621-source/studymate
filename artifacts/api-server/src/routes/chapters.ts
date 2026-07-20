import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, chaptersTable, subjectsTable } from "@workspace/db";

const router = Router();

router.get("/chapters", async (req, res) => {
  try {
    const college = req.query.college as string | undefined;
    const query = db
      .select({
        id: chaptersTable.id,
        title: chaptersTable.title,
        createdAt: chaptersTable.createdAt,
        subjectId: chaptersTable.subjectId,
        subjectName: subjectsTable.name,
        semester: subjectsTable.semester,
        college: subjectsTable.college,
      })
      .from(chaptersTable)
      .innerJoin(subjectsTable, eq(chaptersTable.subjectId, subjectsTable.id));

    const rows = college
      ? await query.where(eq(subjectsTable.college, college)).orderBy(desc(chaptersTable.createdAt))
      : await query.orderBy(desc(chaptersTable.createdAt));

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/chapters/:id", async (req, res) => {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, req.params.id));
  if (!chapter) { res.status(404).json({ error: "Chapter not found" }); return; }
  res.json(chapter);
});

export default router;
