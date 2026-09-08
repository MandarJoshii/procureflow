import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getSummaryController,
  getSpendByVendorController,
  getNetworkController,
} from "./analytics.controller";

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get("/summary", getSummaryController);
analyticsRouter.get("/spend-by-vendor", getSpendByVendorController);
analyticsRouter.get("/network", getNetworkController);