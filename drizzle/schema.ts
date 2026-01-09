import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Table for storing generated invitation letters with passport data
 */
export const invitationLetters = mysqlTable("invitationLetters", {
  id: int("id").autoincrement().primaryKey(),
  /** User who generated the letter */
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Extracted passport data */
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  dateOfBirth: varchar("dateOfBirth", { length: 50 }).notNull(), // Format: DD/MM/YYYY
  placeOfBirth: varchar("placeOfBirth", { length: 255 }).notNull(),
  passportNumber: varchar("passportNumber", { length: 50 }).notNull(),
  /** File storage reference */
  pdfUrl: text("pdfUrl").notNull(),
  pdfKey: varchar("pdfKey", { length: 512 }).notNull(), // S3 key for the PDF
  /** Original image reference */
  imageUrl: text("imageUrl"),
  imageKey: varchar("imageKey", { length: 512 }),
  /** Status tracking */
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  /** Timestamps */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InvitationLetter = typeof invitationLetters.$inferSelect;
export type InsertInvitationLetter = typeof invitationLetters.$inferInsert;