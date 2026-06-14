import { Router, type IRouter } from "express";
import healthRouter from "./health";
import todosRouter from "./todos";
import categoriesRouter from "./categories";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/todos", todosRouter);
router.use("/categories", categoriesRouter);

export default router;
