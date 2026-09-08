import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getApprovalInstanceController,
  decideApprovalStepController,
} from "./approval.controller";

export const approvalRouter = Router();

approvalRouter.use(requireAuth);

approvalRouter.get("/:id", getApprovalInstanceController);
approvalRouter.post("/:id/decide", decideApprovalStepController);