import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import subjectsRouter from "./subjects";
import chaptersRouter from "./chapters";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(subjectsRouter);
router.use(chaptersRouter);

export default router;
