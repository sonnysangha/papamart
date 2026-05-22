"use server";

import { auth } from "@clerk/nextjs/server";
import { fetchAction, fetchMutation } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type CheckoutSubmission = {
  items: Array<{ productId: Id<"products">; quantity: number }>;
};

export type CheckoutResult =
  | { ok: true; url: string; sessionId: string; orderId: Id<"orders"> }
  | { ok: false; error: string };

const FREE_SHIPPING_FEATURE = "free_shipping";

export async function startCheckout(
  submission: CheckoutSubmission,
): Promise<CheckoutResult> {
  const session = await auth();
  const clerkUserId = session.userId;
  if (!clerkUserId) {
    return { ok: false, error: "NOT_SIGNED_IN" };
  }

  if (!Array.isArray(submission.items) || submission.items.length === 0) {
    return { ok: false, error: "CART_EMPTY" };
  }

  let hasFreeShipping = false;
  try {
    hasFreeShipping = session.has({ feature: FREE_SHIPPING_FEATURE });
  } catch (err) {
    console.warn("auth().has(free_shipping) check failed", err);
    hasFreeShipping = false;
  }

  const token = await session.getToken({ template: "convex" });

  let orderId: Id<"orders">;
  try {
    const created = await fetchMutation(
      api.orders.createPending,
      {
        clerkUserId,
        items: submission.items.map((it) => ({
          productId: it.productId,
          quantity: Math.max(1, Math.floor(it.quantity)),
        })),
        hasFreeShipping,
      },
      token ? { token } : undefined,
    );
    orderId = created.orderId;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    console.error("createPending failed", err);
    return { ok: false, error: extractErrorCode(msg) };
  }

  try {
    const { url, sessionId } = await fetchAction(
      api.checkout.startStripeCheckout,
      { orderId },
      token ? { token } : undefined,
    );
    return { ok: true, url, sessionId, orderId };
  } catch (err) {
    console.error("startStripeCheckout failed", err);
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    return { ok: false, error: extractErrorCode(msg) };
  }
}

function extractErrorCode(message: string): string {
  const known = [
    "INSUFFICIENT_STOCK",
    "ADDRESS_REQUIRED",
    "CART_EMPTY",
    "PRODUCT_UNAVAILABLE",
    "USER_NOT_FOUND",
    "CURRENCY_MISMATCH",
    "INVALID_QUANTITY",
    "NOT_SIGNED_IN",
    "FORBIDDEN",
  ];
  for (const code of known) {
    if (message.includes(code)) {
      return code;
    }
  }
  return "CHECKOUT_FAILED";
}
