import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { createVendorController, listVendorsController } from "./vendor.controller";

export const vendorRouter = Router();

vendorRouter.use(requireAuth); // every vendor route requires login

vendorRouter.post("/", createVendorController);
vendorRouter.get("/", listVendorsController);