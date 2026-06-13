import { Router, type IRouter } from "express";
import healthRouter from "./health";
import applicationsRouter from "./applications";
import recruitersRouter from "./recruiters";
import resumesRouter from "./resumes";
import interviewPrepRouter from "./interviewPrep";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(applicationsRouter);
router.use(recruitersRouter);
router.use(resumesRouter);
router.use(interviewPrepRouter);
router.use(dashboardRouter);
router.use(aiRouter);

export default router;
