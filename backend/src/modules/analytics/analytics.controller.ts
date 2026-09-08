import { Request, Response } from "express";
import { getSummary, getSpendByVendor, getNetworkData } from "./analytics.service";

export async function getSummaryController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const summary = await getSummary(organizationId);
    return res.status(200).json(summary);
  } catch (err) {
    console.error("Get analytics summary error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getSpendByVendorController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const data = await getSpendByVendor(organizationId);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Get spend by vendor error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getNetworkController(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;
    const data = await getNetworkData(organizationId);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Get network data error:", err);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
}