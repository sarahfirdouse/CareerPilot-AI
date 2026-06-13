import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, applicationsTable, activityLogTable } from "@workspace/db";
import { getAuth } from "@clerk/express";

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

router.get("/dashboard/stats", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const apps = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, userId));

  const total = apps.length;
  const interviews = apps.filter((a) =>
    ["interview_scheduled", "final_round"].includes(a.status),
  ).length;
  const offers = apps.filter((a) => a.status === "offer").length;
  const rejections = apps.filter((a) => a.status === "rejected").length;
  const active = apps.filter((a) =>
    ["applied", "oa_received", "interview_scheduled", "final_round"].includes(a.status),
  ).length;
  const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  res.json({
    totalApplications: total,
    interviews,
    offers,
    rejections,
    successRate,
    activeApplications: active,
  });
});

router.get("/dashboard/activity", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const activity = await db
    .select()
    .from(activityLogTable)
    .where(eq(activityLogTable.userId, userId))
    .orderBy(desc(activityLogTable.createdAt))
    .limit(20);

  res.json(activity);
});

router.get("/dashboard/monthly-trend", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const result = await db
    .select({
      month: sql<string>`to_char(${applicationsTable.createdAt}, 'Mon')`,
      year: sql<number>`extract(year from ${applicationsTable.createdAt})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .where(
      and(
        eq(applicationsTable.userId, userId),
        sql`${applicationsTable.createdAt} >= now() - interval '6 months'`,
      ),
    )
    .groupBy(
      sql`to_char(${applicationsTable.createdAt}, 'Mon')`,
      sql`extract(year from ${applicationsTable.createdAt})`,
      sql`date_trunc('month', ${applicationsTable.createdAt})`,
    )
    .orderBy(sql`date_trunc('month', ${applicationsTable.createdAt})`);

  res.json(result);
});

router.get("/dashboard/status-breakdown", requireAuth, async (req: any, res): Promise<void> => {
  const userId = req.userId as string;

  const result = await db
    .select({
      status: applicationsTable.status,
      count: sql<number>`count(*)::int`,
    })
    .from(applicationsTable)
    .where(eq(applicationsTable.userId, userId))
    .groupBy(applicationsTable.status);

  res.json(result);
});

export default router;
