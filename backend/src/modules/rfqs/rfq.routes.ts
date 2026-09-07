import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  createRFQController,
  listRFQsController,
  getRFQController,
} from "./rfq.controller";

export const rfqRouter = Router();

rfqRouter.use(requireAuth);

rfqRouter.post("/", createRFQController);
rfqRouter.get("/", listRFQsController);
rfqRouter.get("/:id", getRFQController);