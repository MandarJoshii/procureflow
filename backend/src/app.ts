import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./modules/auth/auth.routes";
import { vendorRouter } from "./modules/vendors/vendor.routes";
import { quoteRouter } from "./modules/quotes/quote.routes";
import { approvalRouter } from "./modules/approvals/approval.routes";
import { poRouter } from "./modules/purchase-orders/po.routes";
import { invoiceRouter } from "./modules/invoices/invoice.routes";
import { rfqRouter } from "./modules/rfqs/rfq.routes";
import { paymentRouter } from "./modules/payments/payment.routes";
import { analyticsRouter } from "./modules/analytics/analytics.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/vendors", vendorRouter);
  app.use("/api/rfqs", rfqRouter);
  app.use("/api/rfqs/:rfqId/quotes", quoteRouter);
  app.use("/api/approvals", approvalRouter);
  app.use("/api/purchase-orders", poRouter);
  app.use("/api/invoices", invoiceRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/analytics", analyticsRouter);

  return app;
}