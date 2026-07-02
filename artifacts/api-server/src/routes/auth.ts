import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { ensureMigrated } from "@workspace/db/migrate";
import { signToken, verifyToken, extractBearer } from "../lib/token";
import { rateLimit } from "express-rate-limit";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts from this IP, please try again after 15 minutes." },
});

router.post("/auth/email-login", authLimiter, async (req, res) => {
  try {
    await ensureMigrated();
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role });
    res.json({ token });
  } catch (err: any) {
    console.error("[auth/email-login]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." });
  }
});

router.post("/auth/email-signup", authLimiter, async (req, res) => {
  try {
    await ensureMigrated();
    const { firstName, lastName, email, password, college, year } = req.body as {
      firstName?: string; lastName?: string; email?: string;
      password?: string; college?: string; year?: string;
    };
    if (!email || !password || !firstName) {
      res.status(400).json({ error: "First name, email and password are required" });
      return;
    }
    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName: lastName ?? "",
      college: college ?? "CSE",
      year: year ?? "1",
      role: "student",
    }).returning();
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({ token });
  } catch (err: any) {
    console.error("[auth/email-signup]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." });
  }
});

router.get("/auth/user", async (req, res) => {
  try {
    await ensureMigrated();
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.json({ user: null }); return; }
    const payload = verifyToken(token);
    if (!payload?.userId) { res.json({ user: null }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId as string));
    if (!user) { res.json({ user: null }); return; }
    res.json({
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, college: user.college, year: user.year,
        role: user.role, profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (err: any) {
    console.error("[auth/user]", err?.message);
    res.json({ user: null });
  }
});

router.put("/auth/profile", async (req, res) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
    const payload = verifyToken(token);
    if (!payload?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const { firstName, lastName, college, year } = req.body as Record<string, string | undefined>;
    const updates: Record<string, string> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (college !== undefined) updates.college = college;
    if (year !== undefined) updates.year = year;

    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

    const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, payload.userId as string)).returning();
    res.json({
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, college: user.college, year: user.year,
        role: user.role, profileImageUrl: user.profileImageUrl,
      },
    });
  } catch (err: any) {
    console.error("[auth/profile]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});

router.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

export default router;
