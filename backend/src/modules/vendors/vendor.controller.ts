import { Request, Response } from "express";
import { createVendorSchema } from "./vendor.schema";
import { createVendor, listVendors } from "./vendor.service";

export async function createVendorController(req: Request, res: Response) {
  const parseResult = createVendorSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(422).json({
      error: "VALIDATION_ERROR",
      details: parseResult.error.flatten(),
    });
  }

  try {
    const organizationId = req.user!.organizationId;
    const link = await createVendor(organizationId, parseResult.data);
    return res.status(201).json(link);
  } catch (err) {
    if (err instanceof Error && err.message === "VENDOR_ALREADY_LINKED") {
      return res.status(409).json({ error: "VENDOR_ALREADY_LINKED" });
    }
    console.error("Create vendor error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function listVendorsController(req: Request, res: Response) {
  try {
    const organizationId = req.user!.organizationId;
    const vendors = await listVendors(organizationId);
    return res.status(200).json(vendors);
  } catch (err) {
    console.error("List vendors error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}