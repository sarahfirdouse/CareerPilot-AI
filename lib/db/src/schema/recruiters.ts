import { pgTable, text, serial, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recruitersTable = pgTable("recruiters", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  email: text("email"),
  linkedin: text("linkedin"),
  phone: text("phone"),
  notes: text("notes"),
  followUpDate: date("follow_up_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRecruiterSchema = createInsertSchema(recruitersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertRecruiter = z.infer<typeof insertRecruiterSchema>;
export type Recruiter = typeof recruitersTable.$inferSelect;
