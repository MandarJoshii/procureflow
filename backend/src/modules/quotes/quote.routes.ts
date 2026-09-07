import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { createQuoteController, selectQuoteController } from "./quote.controller";

export const quoteRouter = Router({ mergeParams: true });

quoteRouter.use(requireAuth);

quoteRouter.post("/", createQuoteController);
quoteRouter.post("/:quoteId/select", selectQuoteController);