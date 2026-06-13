import { pgTable, text, serial, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationStatusEnum = [
  "wishlist",
  "applied",
  "oa_received",
  "interview_scheduled",
  "final_round",
  "offer",
  "rejected",
] as const;

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  location: text("location"),
  salary: text("salary"),
  appliedDate: date("applied_date", { mode: "string" }).notNull(),
  status: text("status", { enum: applicationStatusEnum }).notNull().default("applied"),
  notes: text("notes"),
  jobUrl: text("job_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
