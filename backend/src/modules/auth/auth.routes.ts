import { Router } from "express";
import { signupController, loginController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/signup", signupController);
authRouter.post("/login", loginController);

// test route to confirm auth middleware works
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});