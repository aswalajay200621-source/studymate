import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { semestersTable } from "./semesters";

export const subjectsTable = pgTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  semester: integer("semester").notNull().default(1),
  semesterId: text("semester_id").references(() => semestersTable.id, { onDelete: "set null" }),
  college: text("college").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#4361EE"),
  icon: text("icon").notNull().default("book"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ createdAt: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
