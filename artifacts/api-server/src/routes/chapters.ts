import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, chaptersTable, flashcardsTable, quizQuestionsTable } from "@workspace/db";

const router = Router();

router.get("/chapters/:id", async (req, res) => {
  const [chapter] = await db.select().from(chaptersTable).where(eq(chaptersTable.id, req.params.id));
  if (!chapter) { res.status(404).json({ error: "Chapter not found" }); return; }
  const flashcards = await db.select().from(flashcardsTable).where(eq(flashcardsTable.chapterId, req.params.id)).orderBy(asc(flashcardsTable.orderIndex));
  const quiz = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.chapterId, req.params.id)).orderBy(asc(quizQuestionsTable.orderIndex));
  res.json({
    ...chapter,
    flashcards,
    quiz,
  });
});

export default router;
