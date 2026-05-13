import { Router, type IRouter } from "express";
import healthRouter from "./health";
import menuRouter from "./menu";
import tablesRouter from "./tables";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import uploadsRouter from "./uploads";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(menuRouter);
router.use(tablesRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(uploadsRouter);
router.use(adminRouter);

export default router;
