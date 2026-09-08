import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  initiatePaymentController,
  getPaymentController,
  razorpayWebhookController,
} from "./payment.controller";

export const paymentRouter = Router();

// webhook route is intentionally NOT behind requireAuth
paymentRouter.post("/webhook", razorpayWebhookController);

paymentRouter.use(requireAuth);
paymentRouter.post("/", initiatePaymentController);
paymentRouter.get("/invoice/:invoiceId", getPaymentController);