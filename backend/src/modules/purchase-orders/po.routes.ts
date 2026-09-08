import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { createPOController, listPOsController, getPOController } from "./po.controller";

export const poRouter = Router();

poRouter.use(requireAuth);

poRouter.post("/", createPOController);
poRouter.get("/", listPOsController);
poRouter.get("/:id", getPOController);