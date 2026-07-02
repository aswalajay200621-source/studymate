import { sql } from "drizzle-orm";
import { pgTable, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  college: varchar("college").default("CSE"),
  year: varchar("year").default("1"),
  role: varchar("role").default("student"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: varchar("verification_token"),
  resetToken: varchar("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires", { withTimezone: true }),
  tokenVersion: integer("token_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UpsertUser = typeof usersTable.$inferInsert;
export type User = typeof usersTable.$inferSelect;
