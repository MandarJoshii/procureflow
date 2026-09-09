import { Router } from "express";
import { signupController, loginController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { authRateLimiter } from "../../middleware/rateLimit.middleware";

export const authRouter = Router();

authRouter.post("/signup", authRateLimiter, signupController);
authRouter.post("/login", authRateLimiter, loginController);

// test route to confirm auth middleware works
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});