import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, recruitersTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  CreateRecruiterBody,
  GetRecruiterParams,
  UpdateRecruiterParams,
  UpdateRecruiterBody,
  DeleteRecruiterParams,
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

router.get("/recruiters", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const recruiters = await db
    .select()
    .from(recruitersTable)
    .where(eq(recruitersTable.userId, userId))
    .orderBy(desc(recruitersTable.createdAt));
  res.json(recruiters);
});

router.post("/recruiters", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateRecruiterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recruiter] = await db
    .insert(recruitersTable)
    .values({
      ...parsed.data,
      userId,
      followUpDate: parsed.data.followUpDate ? String(parsed.data.followUpDate) : undefined,
    })
    .returning();

  await db.insert(activityLogTable).values({
    userId,
    type: "recruiter_added",
    description: `Added recruiter ${recruiter.name} from ${recruiter.company}`,
    entityId: recruiter.id,
    entityType: "recruiter",
  });

  res.status(201).json(recruiter);
});

router.get("/recruiters/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = GetRecruiterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [recruiter] = await db
    .select()
    .from(recruitersTable)
    .where(
      and(
        eq(recruitersTable.id, params.data.id),
        eq(recruitersTable.userId, userId),
      ),
    );

  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  res.json(recruiter);
});

router.patch("/recruiters/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = UpdateRecruiterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRecruiterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [recruiter] = await db
    .update(recruitersTable)
    .set(parsed.data as any)
    .where(
      and(
        eq(recruitersTable.id, params.data.id),
        eq(recruitersTable.userId, userId),
      ),
    )
    .returning();

  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  res.json(recruiter);
});

router.delete("/recruiters/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = DeleteRecruiterParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [recruiter] = await db
    .delete(recruitersTable)
    .where(
      and(
        eq(recruitersTable.id, params.data.id),
        eq(recruitersTable.userId, userId),
      ),
    )
    .returning();

  if (!recruiter) {
    res.status(404).json({ error: "Recruiter not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
