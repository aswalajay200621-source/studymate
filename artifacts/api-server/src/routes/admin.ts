import { Router, type Request, type Response, type NextFunction } from "express";
import { eq, asc } from "drizzle-orm";
import {
  db,
  semestersTable, insertSemesterSchema,
  subjectsTable, insertSubjectSchema,
  chaptersTable, insertChapterSchema,
} from "@workspace/db";
import { signToken, verifyToken, extractBearer } from "../lib/token";

const router = Router();

if (process.env.NODE_ENV === "production" && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === "studymate2024")) {
  throw new Error("CRITICAL SECURITY ERROR: You must set a strong, non-default ADMIN_PASSWORD in production environment variables.");
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "studymate2024";

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (username === "HAPPINESSAB" && password === ADMIN_PASSWORD) {
    const token = signToken({ role: "admin", sub: "admin" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = extractBearer(req.headers.authorization);
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payload = verifyToken(token);
  if (payload?.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  next();
}

router.use("/admin", requireAdmin);

router.get("/admin/semesters", async (_req, res) => {
  const rows = await db.select().from(semestersTable).orderBy(asc(semestersTable.orderIndex));
  res.json(rows);
});

router.post("/admin/semesters", async (req, res) => {
  const parsed = insertSemesterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(semestersTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.delete("/admin/semesters/:id", async (req, res) => {
  await db.delete(semestersTable).where(eq(semestersTable.id, req.params.id));
  res.status(204).end();
});

router.get("/admin/subjects", async (_req, res) => {
  const rows = await db.select().from(subjectsTable).orderBy(asc(subjectsTable.semester));
  res.json(rows);
});

router.post("/admin/subjects", async (req, res) => {
  const parsed = insertSubjectSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(subjectsTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.delete("/admin/subjects/:id", async (req, res) => {
  await db.delete(subjectsTable).where(eq(subjectsTable.id, req.params.id));
  res.status(204).end();
});

router.get("/admin/subjects/:id/chapters", async (req, res) => {
  const rows = await db.select({
    id: chaptersTable.id,
    subjectId: chaptersTable.subjectId,
    title: chaptersTable.title,
    orderIndex: chaptersTable.orderIndex,
  }).from(chaptersTable).where(eq(chaptersTable.subjectId, req.params.id)).orderBy(asc(chaptersTable.orderIndex));
  res.json(rows);
});

router.post("/admin/chapters", async (req, res) => {
  const parsed = insertChapterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(chaptersTable).values(parsed.data).returning();
  res.status(201).json(row);
});

router.put("/admin/chapters/:id", async (req, res) => {
  const { contentHtml, title, summary, orderIndex } = req.body as Record<string, string | number | undefined>;
  const updates: Record<string, unknown> = {};
  if (contentHtml !== undefined) updates.contentHtml = contentHtml;
  if (title !== undefined) updates.title = title;
  if (summary !== undefined) updates.summary = summary;
  if (orderIndex !== undefined) updates.orderIndex = Number(orderIndex);
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  const [row] = await db.update(chaptersTable).set(updates).where(eq(chaptersTable.id, req.params.id)).returning();
  res.json(row);
});

router.delete("/admin/chapters/:id", async (req, res) => {
  await db.delete(chaptersTable).where(eq(chaptersTable.id, req.params.id));
  res.status(204).end();
});

export default router;
