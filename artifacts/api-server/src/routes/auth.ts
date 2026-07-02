import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, usersTable } from "@workspace/db";
import { ensureMigrated } from "@workspace/db/migrate";
import { signToken, verifyToken, extractBearer } from "../lib/token";
import { rateLimit } from "express-rate-limit";

const router = Router();

// ── Rate limiter: 10 attempts per 15 min per IP ────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts from this IP, please try again after 15 minutes." },
});

// ── Email helper ───────────────────────────────────────────────────────────
async function sendVerificationEmail(to: string, token: string) {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:8081";
  const link = `${baseUrl}/verify?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "StudyMate <noreply@yourdomain.com>",
          to,
          subject: "Verify your StudyMate account",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#7C5CFC">Welcome to StudyMate! 🎓</h2>
              <p>Click the button below to verify your email address:</p>
              <a href="${link}" style="display:inline-block;background:#7C5CFC;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Verify Email
              </a>
              <p style="color:#6B7280;font-size:13px">Link expires in 24 hours. If you didn't sign up, ignore this email.</p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("[email] Failed to send verification email:", err);
    }
  } else {
    // Dev mode: log link to console
    console.log(`\n[DEV] Verification link for ${to}:\n${link}\n`);
  }
}

async function sendResetEmail(to: string, token: string) {
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:8081";
  const link = `${baseUrl}/reset-password?token=${token}`;

  if (process.env.RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "StudyMate <noreply@yourdomain.com>",
          to,
          subject: "Reset your StudyMate password",
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#7C5CFC">Reset Password</h2>
              <p>Click the button below to reset your password. This link expires in 1 hour.</p>
              <a href="${link}" style="display:inline-block;background:#7C5CFC;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                Reset Password
              </a>
              <p style="color:#6B7280;font-size:13px">If you didn't request this, ignore this email — your password won't change.</p>
            </div>
          `,
        }),
      });
    } catch (err) {
      console.error("[email] Failed to send reset email:", err);
    }
  } else {
    console.log(`\n[DEV] Password reset link for ${to}:\n${link}\n`);
  }
}

// ── Helper to build safe user response ─────────────────────────────────────
function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    college: user.college,
    year: user.year,
    role: user.role,
    isVerified: user.isVerified,
    profileImageUrl: user.profileImageUrl,
  };
}

// ── POST /api/auth/email-signup ─────────────────────────────────────────────
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
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    if (firstName.length > 64 || (lastName?.length ?? 0) > 64) {
      res.status(400).json({ error: "Name is too long" });
      return;
    }

    const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing.length > 0) {
      res.status(409).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");
    const isDev = process.env.NODE_ENV !== "production";

    const [user] = await db.insert(usersTable).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName: lastName ?? "",
      college: college ?? "CSE",
      year: year ?? "1",
      role: "student",
      isVerified: isDev, // auto-verify in development for convenience
      verificationToken: isDev ? null : verificationToken,
      tokenVersion: 1,
    }).returning();

    if (!isDev) {
      await sendVerificationEmail(email.toLowerCase(), verificationToken);
    }

    const token = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion });
    res.status(201).json({
      token,
      requiresVerification: !isDev,
      message: isDev ? undefined : "Account created! Please check your email to verify your account.",
    });
  } catch (err: any) {
    console.error("[auth/email-signup]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." });
  }
});

// ── POST /api/auth/email-login ──────────────────────────────────────────────
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
    if (!user.isVerified) {
      res.status(403).json({ error: "Please verify your email before logging in. Check your inbox." });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion });
    res.json({ token });
  } catch (err: any) {
    console.error("[auth/email-login]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable. Please try again shortly." });
  }
});

// ── GET /api/auth/verify?token=... ─────────────────────────────────────────
router.get("/auth/verify", async (req, res) => {
  try {
    await ensureMigrated();
    const { token } = req.query as { token?: string };
    if (!token) {
      res.status(400).json({ error: "Verification token is required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.verificationToken, token));
    if (!user) {
      res.status(400).json({ error: "Invalid or expired verification token" });
      return;
    }
    await db.update(usersTable)
      .set({ isVerified: true, verificationToken: null })
      .where(eq(usersTable.id, user.id));

    const newToken = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion });
    res.json({ token: newToken, message: "Email verified successfully! You can now log in." });
  } catch (err: any) {
    console.error("[auth/verify]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});

// ── POST /api/auth/forgot-password ─────────────────────────────────────────
router.post("/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    await ensureMigrated();
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    // Always return 200 to prevent email enumeration
    if (!user) {
      res.json({ message: "If an account with that email exists, a reset link has been sent." });
      return;
    }
    const resetToken = randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.update(usersTable)
      .set({ resetToken, resetTokenExpires: resetExpires })
      .where(eq(usersTable.id, user.id));

    await sendResetEmail(email.toLowerCase(), resetToken);
    res.json({ message: "If an account with that email exists, a reset link has been sent." });
  } catch (err: any) {
    console.error("[auth/forgot-password]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});

// ── POST /api/auth/reset-password ──────────────────────────────────────────
router.post("/auth/reset-password", authLimiter, async (req, res) => {
  try {
    await ensureMigrated();
    const { token, password } = req.body as { token?: string; password?: string };
    if (!token || !password) {
      res.status(400).json({ error: "Token and new password are required" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token));
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    // Increment tokenVersion to invalidate all existing sessions
    await db.update(usersTable)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
        tokenVersion: (user.tokenVersion ?? 1) + 1,
      })
      .where(eq(usersTable.id, user.id));

    res.json({ message: "Password reset successfully. Please log in with your new password." });
  } catch (err: any) {
    console.error("[auth/reset-password]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});

// ── GET /api/auth/user ──────────────────────────────────────────────────────
router.get("/auth/user", async (req, res) => {
  try {
    await ensureMigrated();
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.json({ user: null }); return; }
    const payload = verifyToken(token);
    if (!payload?.userId) { res.json({ user: null }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId as string));
    if (!user) { res.json({ user: null }); return; }
    // Validate tokenVersion — if user's version is higher, token is revoked
    if (typeof payload.tv === "number" && payload.tv !== user.tokenVersion) {
      res.json({ user: null }); return;
    }
    res.json({ user: userResponse(user) });
  } catch (err: any) {
    console.error("[auth/user]", err?.message);
    res.json({ user: null });
  }
});

// ── PUT /api/auth/profile ───────────────────────────────────────────────────
router.put("/auth/profile", async (req, res) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }
    const payload = verifyToken(token);
    if (!payload?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [currentUser] = await db.select({ tokenVersion: usersTable.tokenVersion })
      .from(usersTable).where(eq(usersTable.id, payload.userId as string));
    if (!currentUser) { res.status(401).json({ error: "Unauthorized" }); return; }
    if (typeof payload.tv === "number" && payload.tv !== currentUser.tokenVersion) {
      res.status(401).json({ error: "Session expired. Please log in again." }); return;
    }

    const { firstName, lastName, college, year } = req.body as Record<string, string | undefined>;
    const updates: Record<string, string> = {};
    if (firstName !== undefined) updates.firstName = String(firstName).slice(0, 64);
    if (lastName  !== undefined) updates.lastName  = String(lastName).slice(0, 64);
    if (college   !== undefined) updates.college   = String(college).slice(0, 10);
    if (year      !== undefined) updates.year      = String(year).slice(0, 1);
    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

    const [user] = await db.update(usersTable).set(updates)
      .where(eq(usersTable.id, payload.userId as string)).returning();
    res.json({ user: userResponse(user) });
  } catch (err: any) {
    console.error("[auth/profile]", err?.message);
    res.status(503).json({ error: "Service temporarily unavailable." });
  }
});

// ── POST /api/auth/logout ───────────────────────────────────────────────────
// Increment tokenVersion to invalidate the current token server-side
router.post("/auth/logout", async (req, res) => {
  try {
    const token = extractBearer(req.headers.authorization);
    if (token) {
      const payload = verifyToken(token);
      if (payload?.userId) {
        const [user] = await db.select({ id: usersTable.id, tokenVersion: usersTable.tokenVersion })
          .from(usersTable).where(eq(usersTable.id, payload.userId as string));
        if (user) {
          await db.update(usersTable)
            .set({ tokenVersion: (user.tokenVersion ?? 1) + 1 })
            .where(eq(usersTable.id, user.id));
        }
      }
    }
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[auth/logout]", err?.message);
    res.json({ ok: true }); // always succeed logout from client's perspective
  }
});

export default router;
