import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  createInvoiceController,
  listInvoicesController,
  getInvoiceController,
} from "./invoice.controller";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuth);

invoiceRouter.post("/", createInvoiceController);
invoiceRouter.get("/", listInvoicesController);
invoiceRouter.get("/:id", getInvoiceController);