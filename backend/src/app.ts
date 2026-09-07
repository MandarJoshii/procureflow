import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./modules/auth/auth.routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173", credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);

  return app;
}