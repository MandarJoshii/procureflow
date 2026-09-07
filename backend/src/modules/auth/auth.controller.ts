import { Request, Response } from "express";
import { signupSchema, loginSchema } from "./auth.schema";
import { signup, login } from "./auth.service";

export async function signupController(req: Request, res: Response) {
  const parseResult = signupSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const result = await signup(parseResult.data);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_ALREADY_EXISTS") {
      return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });
    }
    console.error("Signup error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function loginController(req: Request, res: Response) {
  const parseResult = loginSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const result = await login(parseResult.data);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_CREDENTIALS") {
      return res.status(401).json({ error: "INVALID_CREDENTIALS" });
    }
    console.error("Login error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}