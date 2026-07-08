import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import subjectsRouter from "./subjects";
import chaptersRouter from "./chapters";
import userNotesRouter from "./userNotes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(subjectsRouter);
router.use(chaptersRouter);
router.use(userNotesRouter);

export default router;
