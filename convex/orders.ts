import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import schema from "./schema";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp";

const FLAT_SHIPPING_CENTS = 499;
const RESERVATION_WINDOW_MS = 30 * 60 * 1000;

const orderDocValidator = v.object({
  _id: v.id("orders"),
  _creationTime: v.number(),
  ...schema.tables.orders.validator.fields,
});

const orderItemDocValidator = v.object({
  _id: v.id("orderItems"),
  _creationTime: v.number(),
  ...schema.tables.orderItems.validator.fields,
});

async function getCurrentUserOrNull(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    return null;
  }
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
}

export const listMine = query({
  args: {},
  returns: v.array(orderDocValidator),
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (user === null) {
      return [];
    }
    return await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

export const getMine = query({
  args: { orderId: v.id("orders") },
  returns: v.union(
    v.null(),
    v.object({
      order: orderDocValidator,
      items: v.array(orderItemDocValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrNull(ctx);
    if (user === null) {
      return null;
    }
    const order = await ctx.db.get(args.orderId);
    if (order === null || order.userId !== user._id) {
      return null;
    }
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .take(200);
    return { order, items };
  },
});

export const getBySessionId = query({
  args: { sessionId: v.string() },
  returns: v.union(v.null(), orderDocValidator),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrNull(ctx);
    if (user === null) {
      return null;
    }
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.sessionId),
      )
      .unique();
    if (order === null || order.userId !== user._id) {
      return null;
    }
    return order;
  },
});

export const _getOrderForCheckout = internalQuery({
  args: { orderId: v.id("orders") },
  returns: v.object({
    order: orderDocValidator,
    items: v.array(orderItemDocValidator),
    user: v.object({
      _id: v.id("users"),
      clerkUserId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
    }),
  }),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (order === null) {
      throw new Error("Order not found");
    }
    const user = await ctx.db.get(order.userId);
    if (user === null) {
      throw new Error("Order owner not found");
    }
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .take(200);
    return {
      order,
      items,
      user: {
        _id: user._id,
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
      },
    };
  },
});

export const createPending = mutation({
  args: {
    clerkUserId: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      }),
    ),
    hasFreeShipping: v.boolean(),
  },
  returns: v.object({
    orderId: v.id("orders"),
    currency: v.string(),
    totalCents: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("NOT_SIGNED_IN");
    }
    if (args.clerkUserId !== identity.subject) {
      throw new Error("FORBIDDEN");
    }

    if (args.items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId),
      )
      .unique();
    if (user === null) {
      throw new Error("USER_NOT_FOUND");
    }
    if (!user.address) {
      throw new Error("ADDRESS_REQUIRED");
    }

    let subtotal = 0;
    let currency: string | null = null;
    type ResolvedLine = {
      product: Doc<"products">;
      quantity: number;
    };
    const resolved: ResolvedLine[] = [];

    for (const line of args.items) {
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }
      const product = await ctx.db.get(line.productId);
      if (product === null || !product.isActive) {
        throw new Error("PRODUCT_UNAVAILABLE");
      }
      if (line.quantity > product.stock) {
        throw new Error("INSUFFICIENT_STOCK");
      }
      if (currency === null) {
        currency = product.currency;
      } else if (currency !== product.currency) {
        throw new Error("CURRENCY_MISMATCH");
      }
      subtotal += product.priceCents * line.quantity;
      resolved.push({ product, quantity: line.quantity });
    }

    if (currency === null) {
      currency = DEFAULT_CURRENCY;
    }

    for (const { product, quantity } of resolved) {
      await ctx.db.patch(product._id, {
        stock: product.stock - quantity,
      });
    }

    const shippingCents = args.hasFreeShipping ? 0 : FLAT_SHIPPING_CENTS;
    const totalCents = subtotal + shippingCents;
    const now = Date.now();

    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      status: "pending",
      subtotalCents: subtotal,
      shippingCents,
      totalCents,
      currency,
      hadFreeShipping: args.hasFreeShipping,
      shippingAddress: user.address,
      reservedUntil: now + RESERVATION_WINDOW_MS,
      createdAt: now,
    });

    for (const { product, quantity } of resolved) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: product._id,
        nameSnapshot: product.name,
        priceCentsSnapshot: product.priceCents,
        quantity,
      });
    }

    return { orderId, currency, totalCents };
  },
});

export const attachStripeSession = internalMutation({
  args: {
    orderId: v.id("orders"),
    stripeSessionId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (order === null) {
      throw new Error("Order not found");
    }
    await ctx.db.patch(args.orderId, {
      stripeSessionId: args.stripeSessionId,
    });
    return null;
  },
});

export const markPaid = internalMutation({
  args: {
    stripeSessionId: v.string(),
    paymentIntentId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId),
      )
      .unique();
    if (order === null) {
      console.warn(
        "markPaid: order not found for session",
        args.stripeSessionId,
      );
      return null;
    }
    if (
      order.status === "paid" ||
      order.status === "fulfilled" ||
      order.status === "cancelled"
    ) {
      return null;
    }
    await ctx.db.patch(order._id, {
      status: "paid",
      stripePaymentIntentId: args.paymentIntentId,
    });
    return null;
  },
});

async function restoreStockAndCancel(
  ctx: MutationCtx,
  orderId: Id<"orders">,
) {
  const order = await ctx.db.get(orderId);
  if (order === null) {
    return;
  }
  if (order.status !== "pending") {
    return;
  }
  const items = await ctx.db
    .query("orderItems")
    .withIndex("by_order", (q) => q.eq("orderId", orderId))
    .take(200);
  for (const item of items) {
    const product = await ctx.db.get(item.productId);
    if (product === null) continue;
    await ctx.db.patch(product._id, {
      stock: product.stock + item.quantity,
    });
  }
  await ctx.db.patch(orderId, { status: "cancelled" });
}

export const cancelExpired = internalMutation({
  args: { stripeSessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripe_session", (q) =>
        q.eq("stripeSessionId", args.stripeSessionId),
      )
      .unique();
    if (order === null) {
      console.warn(
        "cancelExpired: order not found for session",
        args.stripeSessionId,
      );
      return null;
    }
    await restoreStockAndCancel(ctx, order._id);
    return null;
  },
});

export const expireStale = internalMutation({
  args: {},
  returns: v.object({ cancelled: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const stale = await ctx.db
      .query("orders")
      .withIndex("by_reservedUntil", (q) => q.lt("reservedUntil", now))
      .take(100);

    let cancelled = 0;
    for (const order of stale) {
      if (order.status === "pending") {
        await restoreStockAndCancel(ctx, order._id);
        cancelled += 1;
      }
    }
    return { cancelled };
  },
});

