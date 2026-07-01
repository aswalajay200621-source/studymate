import { Router } from "express";
import { eq, asc, sql } from "drizzle-orm";
import { db, subjectsTable, chaptersTable } from "@workspace/db";

const router = Router();

router.get("/subjects", async (req, res) => {
  const college = req.query.college as string | undefined;
  const query = db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      code: subjectsTable.code,
      semester: subjectsTable.semester,
      college: subjectsTable.college,
      description: subjectsTable.description,
      color: subjectsTable.color,
      icon: subjectsTable.icon,
      chapterCount: sql<number>`(select count(*) from chapters where chapters.subject_id = ${subjectsTable.id})::int`,
    })
    .from(subjectsTable)
    .orderBy(asc(subjectsTable.semester), asc(subjectsTable.name));
  const rows = college
    ? await query.where(eq(subjectsTable.college, college))
    : await query;
  res.json(rows);
});

router.get("/subjects/:id", async (req, res) => {
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, req.params.id));
  if (!subject) { res.status(404).json({ error: "Subject not found" }); return; }
  const chapters = await db.select({
    id: chaptersTable.id,
    title: chaptersTable.title,
    orderIndex: chaptersTable.orderIndex,
  }).from(chaptersTable).where(eq(chaptersTable.subjectId, req.params.id)).orderBy(asc(chaptersTable.orderIndex));
  res.json({ ...subject, chapters });
});

export default router;
