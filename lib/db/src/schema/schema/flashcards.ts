import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { chaptersTable } from "./chapters";

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  chapterId: text("chapter_id")
    .notNull()
    .references(() => chaptersTable.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertFlashcardSchema = createInsertSchema(flashcardsTable).omit({ id: true });
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcardsTable.$inferSelect;
