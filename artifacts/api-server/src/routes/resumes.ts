import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, resumesTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  CreateResumeBody,
  GetResumeParams,
  UpdateResumeParams,
  UpdateResumeBody,
  DeleteResumeParams,
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

router.get("/resumes", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const resumes = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.userId, userId))
    .orderBy(desc(resumesTable.createdAt));
  res.json(resumes);
});

router.post("/resumes", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.isDefault) {
    await db
      .update(resumesTable)
      .set({ isDefault: false })
      .where(eq(resumesTable.userId, userId));
  }

  const [resume] = await db
    .insert(resumesTable)
    .values({ ...parsed.data, userId })
    .returning();

  await db.insert(activityLogTable).values({
    userId,
    type: "resume_uploaded",
    description: `Uploaded resume: ${resume.name}`,
    entityId: resume.id,
    entityType: "resume",
  });

  res.status(201).json(resume);
});

router.get("/resumes/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = GetResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(
      and(
        eq(resumesTable.id, params.data.id),
        eq(resumesTable.userId, userId),
      ),
    );

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(resume);
});

router.patch("/resumes/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = UpdateResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.isDefault) {
    await db
      .update(resumesTable)
      .set({ isDefault: false })
      .where(eq(resumesTable.userId, userId));
  }

  const [resume] = await db
    .update(resumesTable)
    .set(parsed.data as any)
    .where(
      and(
        eq(resumesTable.id, params.data.id),
        eq(resumesTable.userId, userId),
      ),
    )
    .returning();

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.json(resume);
});

router.delete("/resumes/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = DeleteResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resume] = await db
    .delete(resumesTable)
    .where(
      and(
        eq(resumesTable.id, params.data.id),
        eq(resumesTable.userId, userId),
      ),
    )
    .returning();

  if (!resume) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
