import { Router, type IRouter } from "express";
import { eq, and, ilike, desc } from "drizzle-orm";
import { db, applicationsTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import {
  ListApplicationsQueryParams,
  CreateApplicationBody,
  GetApplicationParams,
  UpdateApplicationParams,
  UpdateApplicationBody,
  DeleteApplicationParams,
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

router.get("/applications", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = ListApplicationsQueryParams.safeParse(req.query);
  const userId = req.userId as string;

  let query = db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .$dynamic();

  if (parsed.success && parsed.data.status) {
    query = query.where(
      and(
        eq(applicationsTable.userId, userId),
        eq(applicationsTable.status, parsed.data.status as any),
      ),
    ) as any;
  }

  if (parsed.success && parsed.data.search) {
    const search = parsed.data.search;
    query = query.where(
      and(
        eq(applicationsTable.userId, userId),
        ilike(applicationsTable.company, `%${search}%`),
      ),
    ) as any;
  }

  const applications = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .orderBy(desc(applicationsTable.createdAt));

  res.json(applications);
});

router.post("/applications", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [application] = await db
    .insert(applicationsTable)
    .values({
      ...parsed.data,
      userId,
      appliedDate: String(parsed.data.appliedDate),
    })
    .returning();

  await db.insert(activityLogTable).values({
    userId,
    type: "application_created",
    description: `Applied to ${application.role} at ${application.company}`,
    entityId: application.id,
    entityType: "application",
  });

  res.status(201).json(application);
});

router.get("/applications/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [application] = await db
    .select()
    .from(applicationsTable)
    .where(
      and(
        eq(applicationsTable.id, params.data.id),
        eq(applicationsTable.userId, userId),
      ),
    );

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json(application);
});

router.patch("/applications/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [application] = await db
    .update(applicationsTable)
    .set(parsed.data as any)
    .where(
      and(
        eq(applicationsTable.id, params.data.id),
        eq(applicationsTable.userId, userId),
      ),
    )
    .returning();

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  await db.insert(activityLogTable).values({
    userId,
    type: "application_updated",
    description: `Updated ${application.role} at ${application.company} — status: ${application.status}`,
    entityId: application.id,
    entityType: "application",
  });

  res.json(application);
});

router.delete("/applications/:id", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;
  const params = DeleteApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [application] = await db
    .delete(applicationsTable)
    .where(
      and(
        eq(applicationsTable.id, params.data.id),
        eq(applicationsTable.userId, userId),
      ),
    )
    .returning();

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
