import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, interviewQuestionsTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  ListInterviewQuestionsQueryParams,
  CreateInterviewQuestionBody,
  UpdateInterviewQuestionParams,
  UpdateInterviewQuestionBody,
  DeleteInterviewQuestionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;
  next();
};

router.get("/interview-questions", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = ListInterviewQuestionsQueryParams.safeParse(req.query);

  let conditions: any[] = [eq(interviewQuestionsTable.userId, userId)];
  if (parsed.success && parsed.data.category) {
    conditions.push(eq(interviewQuestionsTable.category, parsed.data.category as any));
  }

  const questions = await db
    .select()
    .from(interviewQuestionsTable)
    .where(and(...conditions))
    .orderBy(desc(interviewQuestionsTable.createdAt));

  res.json(questions);
});

router.post("/interview-questions", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateInterviewQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db
    .insert(interviewQuestionsTable)
    .values({ ...parsed.data, userId })
    .returning();

  res.status(201).json(question);
});

router.patch("/interview-questions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = UpdateInterviewQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInterviewQuestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [question] = await db
    .update(interviewQuestionsTable)
    .set(parsed.data as any)
    .where(
      and(
        eq(interviewQuestionsTable.id, params.data.id),
        eq(interviewQuestionsTable.userId, userId),
      ),
    )
    .returning();

  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.json(question);
});

router.delete("/interview-questions/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = DeleteInterviewQuestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [question] = await db
    .delete(interviewQuestionsTable)
    .where(
      and(
        eq(interviewQuestionsTable.id, params.data.id),
        eq(interviewQuestionsTable.userId, userId),
      ),
    )
    .returning();

  if (!question) {
    res.status(404).json({ error: "Question not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
