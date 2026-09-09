import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { verifyWebhookSignature } from "../../src/modules/payments/payment.service";
import { env } from "../../src/config/env";

describe("verifyWebhookSignature", () => {
  const secret = env.RAZORPAY_KEY_SECRET;

  it("accepts a correctly signed payload", () => {
    const body = '{"payload":{"transfer":{"entity":{"id":"txn_123"}}}}';
    const validSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

    expect(verifyWebhookSignature(body, validSignature)).toBe(true);
  });

  it("rejects a payload with an incorrect signature", () => {
    const body = '{"payload":{"transfer":{"entity":{"id":"txn_123"}}}}';
    expect(verifyWebhookSignature(body, "totally-fake-signature")).toBe(false);
  });

  it("rejects a valid signature paired with tampered body content", () => {
    const originalBody = '{"payload":{"transfer":{"entity":{"id":"txn_123"}}}}';
    const tamperedBody = '{"payload":{"transfer":{"entity":{"id":"txn_999"}}}}';
    const signatureForOriginal = crypto.createHmac("sha256", secret).update(originalBody).digest("hex");

    expect(verifyWebhookSignature(tamperedBody, signatureForOriginal)).toBe(false);
  });
});