import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const questionCategoryEnum = [
  "behavioral",
  "technical",
  "company_specific",
  "general",
] as const;

export const questionDifficultyEnum = ["easy", "medium", "hard"] as const;

export const interviewQuestionsTable = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  category: text("category", { enum: questionCategoryEnum }).notNull().default("general"),
  difficulty: text("difficulty", { enum: questionDifficultyEnum }).notNull().default("medium"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInterviewQuestionSchema = createInsertSchema(interviewQuestionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertInterviewQuestion = z.infer<typeof insertInterviewQuestionSchema>;
export type InterviewQuestion = typeof interviewQuestionsTable.$inferSelect;
