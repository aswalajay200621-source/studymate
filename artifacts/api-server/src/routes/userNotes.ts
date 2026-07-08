import { createRequire } from "module";
import { Router, type Request, type Response, type NextFunction } from "express";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import { db, userNotesTable } from "@workspace/db";
import { extractBearer, verifyToken } from "../lib/token";
import { usersTable } from "@workspace/db";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

const router = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

// Authentication middleware for student routes
async function requireStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearer(req.headers.authorization);
    if (!token) { res.status(401).json({ error: "Unauthorized: Missing token" }); return; }
    const payload = verifyToken(token);
    if (!payload?.userId) { res.status(401).json({ error: "Unauthorized: Invalid token" }); return; }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId as string));
    if (!user) { res.status(401).json({ error: "Unauthorized: User not found" }); return; }
    if (typeof payload.tv === "number" && payload.tv !== user.tokenVersion) {
      res.status(401).json({ error: "Session expired. Please log in again." });
      return;
    }
    // Attach user to req
    (req as any).user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ error: "Authentication failed" });
  }
}

// ── GET /api/user-notes ──────────────────────────────────────────────────────
router.get("/user-notes", requireStudent, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select({
        id: userNotesTable.id,
        title: userNotesTable.title,
        fileName: userNotesTable.fileName,
        prompt: userNotesTable.prompt,
        createdAt: userNotesTable.createdAt,
      })
      .from(userNotesTable)
      .where(eq(userNotesTable.userId, user.id))
      .orderBy(desc(userNotesTable.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch user notes" });
  }
});

// ── GET /api/user-notes/:id ──────────────────────────────────────────────────
router.get("/user-notes/:id", requireStudent, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const [note] = await db
      .select()
      .from(userNotesTable)
      .where(eq(userNotesTable.id, req.params.id as string));
    if (!note) { res.status(404).json({ error: "Note not found" }); return; }
    if (note.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json(note);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to fetch note" });
  }
});

// ── DELETE /api/user-notes/:id ───────────────────────────────────────────────
router.delete("/user-notes/:id", requireStudent, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const [note] = await db
      .select({ userId: userNotesTable.userId })
      .from(userNotesTable)
      .where(eq(userNotesTable.id, req.params.id as string));
    if (!note) { res.status(404).json({ error: "Note not found" }); return; }
    if (note.userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }
    await db.delete(userNotesTable).where(eq(userNotesTable.id, req.params.id as string));
    res.status(204).end();
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Failed to delete note" });
  }
});

// ── POST /api/user-notes/convert ──────────────────────────────────────────────
router.post("/user-notes/convert", requireStudent, upload.single("pdf"), async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const promptInstructions = req.body.prompt ? String(req.body.prompt).trim() : "";
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: "No PDF file was uploaded." });
      return;
    }

    console.log(`[ai-convert] Parsing PDF: ${file.originalname} (${file.size} bytes)...`);
    let pdfText = "";
    try {
      const parsedPdf = await pdf(file.buffer);
      pdfText = parsedPdf.text ? parsedPdf.text.trim() : "";
    } catch (parseErr: any) {
      console.error("[ai-convert] PDF parsing failed:", parseErr);
      res.status(400).json({ error: "Failed to parse PDF text. Please ensure the PDF has readable text (not scanned images)." });
      return;
    }

    if (!pdfText) {
      res.status(400).json({ error: "The uploaded PDF contains no readable text." });
      return;
    }

    // Limit text input size to fit Gemini context limit (e.g. first 60k characters)
    const characterLimit = 60000;
    let truncated = false;
    if (pdfText.length > characterLimit) {
      pdfText = pdfText.slice(0, characterLimit);
      truncated = true;
    }

    let noteTitle = file.originalname.replace(/\.[^/.]+$/, "") + " Notes";
    let contentHtml = "";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Mock generation if no API key is set yet
      console.log("[ai-convert] GEMINI_API_KEY missing, sending mock response");
      contentHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #E2E8F0; background-color: #080B1A; padding: 24px; }
            h1 { color: #A78BFA; border-bottom: 1px solid rgba(124,92,252,0.2); padding-bottom: 8px; margin-top: 0; }
            h2 { color: #C4B5FD; margin-top: 24px; }
            p { margin-bottom: 16px; }
            .badge { display: inline-block; background: rgba(139,92,246,0.2); color: #C4B5FD; padding: 4px 10px; border-radius: 6px; font-size: 13px; font-weight: bold; margin-bottom: 20px; border: 1px solid rgba(139,92,246,0.3); }
            .tip-box { background: rgba(16,185,129,0.1); border-left: 4px solid #10B981; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0; }
            .tip-title { font-weight: bold; color: #34D399; margin-bottom: 4px; }
            .code { font-family: monospace; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; color: #F472B6; }
          </style>
        </head>
        <body>
          <h1>📄 Converted Notes: ${noteTitle}</h1>
          <div class="badge">🚀 MOCK GENERATION SUCCESSFUL</div>
          
          <div class="tip-box">
            <div class="tip-title">API Key Setup Required</div>
            <div>To trigger real PDF-to-HTML study guide conversions using Gemini 2.5 Flash, you must add your Gemini API Key in the <code>.env</code> file:</div>
            <div style="margin-top: 8px; font-weight: bold; font-family: monospace; color: #A78BFA;">GEMINI_API_KEY=your_gemini_api_key_here</div>
          </div>
          
          <h2>📋 Conversion Details</h2>
          <ul>
            <li><strong>Source File:</strong> <code>${file.originalname}</code></li>
            <li><strong>File Size:</strong> ${(file.size / 1024).toFixed(1)} KB</li>
            <li><strong>Character Count parsed:</strong> ${pdfText.length} characters ${truncated ? " (truncated to fit context limit)" : ""}</li>
            <li><strong>Your Custom Prompt:</strong> "<em>${promptInstructions || "None provided"}</em>"</li>
          </ul>

          <h2>💡 What's next?</h2>
          <p>This is a simulated output to demonstrate the end-to-end "MAKE UR OWN" note conversion flow. Once the API key is set in <code>.env</code>, Gemini will analyze the text content of your uploaded PDF and generate complete study guides tailored exactly to your prompt.</p>
        </body>
        </html>
      `;
    } else {
      console.log("[ai-convert] Calling Gemini 2.5 Flash API...");
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `You are an expert study note builder. Generate detailed, structured, clear HTML study notes based on the following text content extracted from a student's PDF:
                
---------------------
${pdfText}
---------------------

Student's Custom Requests/Focus Areas:
"${promptInstructions || "Generate general study notes structured with clear headers, bullet points, summaries, and key definitions."}"

Formatting Requirements:
1. Provide a beautiful HTML document.
2. Use modern CSS styling inside a <style> tag at the top of the HTML. Design it with a clean dark mode theme: background color #080B1A, text color #E2E8F0, clean fonts, purple headings (#A78BFA), nicely padded containers, and neat list designs.
3. Keep the content organized using H1, H2, H3 tags, bullet points, bold key terms, and summary boxes.
4. Respond with ONLY the HTML output. Do not include markdown wraps (like \`\`\`html) or any conversational text before/after the HTML code.`
              }
            ]
          }
        ]
      };

      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!geminiRes.ok) {
        const errorText = await geminiRes.text();
        console.error("[ai-convert] Gemini API returned error:", errorText);
        res.status(502).json({ error: "Gemini AI generation failed. Please check if your API key is valid." });
        return;
      }

      const geminiData = (await geminiRes.json()) as any;
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        res.status(502).json({ error: "Gemini AI returned an empty response." });
        return;
      }

      // Clean markdown code blocks if the model returned them anyway
      contentHtml = rawText.replace(/^```html\s*/i, "").replace(/```\s*$/, "").trim();

      // Simple regex parser to extract a title from H1 tag if present, otherwise fallback
      const h1Match = contentHtml.match(/<h1>(.*?)<\/h1>/i);
      if (h1Match?.[1]) {
        noteTitle = h1Match[1].replace(/<[^>]*>/g, "").trim();
      }
    }

    const noteId = `note-${Date.now()}`;
    const [note] = await db.insert(userNotesTable).values({
      id: noteId,
      userId: user.id,
      title: noteTitle,
      contentHtml,
      prompt: promptInstructions || null,
      fileName: file.originalname,
    }).returning();

    res.status(201).json({ id: note.id, title: note.title });
  } catch (err: any) {
    console.error("[ai-convert] Fatal error:", err);
    res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

export default router;
