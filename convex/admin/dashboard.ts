import { v } from "convex/values";
import { query } from "../_generated/server";
import { orderStatusValidator } from "../schema";
import { requireAdmin } from "./_helpers";

const recentOrderValidator = v.object({
  _id: v.id("orders"),
  status: orderStatusValidator,
  totalCents: v.number(),
  currency: v.string(),
  createdAt: v.number(),
  customer: v.object({
    email: v.string(),
    name: v.union(v.string(), v.null()),
  }),
});

const statsValidator = v.object({
  productCount: v.number(),
  activeProductCount: v.number(),
  categoryCount: v.number(),
  customerCount: v.number(),
  openOrderCount: v.number(),
  revenueRecentCents: v.number(),
  revenueRecentSince: v.union(v.number(), v.null()),
  currency: v.string(),
  recentOrders: v.array(recentOrderValidator),
});

export const getStats = query({
  // `since` is a stable cutoff (ms epoch) provided by the caller. Using
  // `Date.now()` inside a Convex query would break reactivity/caching.
  args: { since: v.optional(v.number()) },
  returns: statsValidator,
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const [products, categories, users, recentOrders, paidOrders, pending] =
      await Promise.all([
        ctx.db.query("products").take(1000),
        ctx.db.query("categories").take(500),
        ctx.db.query("users").take(1000),
        ctx.db.query("orders").order("desc").take(10),
        ctx.db
          .query("orders")
          .withIndex("by_status", (q) => q.eq("status", "paid"))
          .order("desc")
          .take(500),
        ctx.db
          .query("orders")
          .withIndex("by_status", (q) => q.eq("status", "pending"))
          .order("desc")
          .take(500),
      ]);

    const fulfilled = await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", "fulfilled"))
      .order("desc")
      .take(500);

    const revenuePool = [...paidOrders, ...fulfilled];
    const since = args.since ?? null;
    const revenueRecentCents = revenuePool
      .filter((order) => since === null || order.createdAt >= since)
      .reduce((sum, order) => sum + order.totalCents, 0);

    const recent = await Promise.all(
      recentOrders.map(async (order) => {
        const customer = await ctx.db.get(order.userId);
        return {
          _id: order._id,
          status: order.status,
          totalCents: order.totalCents,
          currency: order.currency,
          createdAt: order.createdAt,
          customer: {
            email: customer?.email ?? "",
            name: customer?.name ?? null,
          },
        };
      }),
    );

    const currency =
      paidOrders[0]?.currency ??
      fulfilled[0]?.currency ??
      pending[0]?.currency ??
      products[0]?.currency ??
      (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp");

    return {
      productCount: products.length,
      activeProductCount: products.filter((p) => p.isActive).length,
      categoryCount: categories.length,
      customerCount: users.length,
      openOrderCount: pending.length + paidOrders.length,
      revenueRecentCents,
      revenueRecentSince: since,
      currency,
      recentOrders: recent,
    };
  },
});
