import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import schema, { addressValidator, orderStatusValidator } from "../schema";
import { requireAdmin } from "./_helpers";

const orderSummaryValidator = v.object({
  _id: v.id("orders"),
  _creationTime: v.number(),
  ...schema.tables.orders.validator.fields,
  itemCount: v.number(),
  customer: v.object({
    _id: v.id("users"),
    email: v.string(),
    name: v.union(v.string(), v.null()),
  }),
});

const orderItemValidator = v.object({
  _id: v.id("orderItems"),
  _creationTime: v.number(),
  ...schema.tables.orderItems.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
  currentStock: v.union(v.number(), v.null()),
});

const orderDetailValidator = v.object({
  _id: v.id("orders"),
  _creationTime: v.number(),
  ...schema.tables.orders.validator.fields,
  customer: v.object({
    _id: v.id("users"),
    clerkUserId: v.string(),
    email: v.string(),
    name: v.union(v.string(), v.null()),
    address: v.union(addressValidator, v.null()),
  }),
  items: v.array(orderItemValidator),
});

export const listAll = query({
  args: { status: v.optional(orderStatusValidator) },
  returns: v.array(orderSummaryValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const orders =
      args.status !== undefined
        ? await ctx.db
            .query("orders")
            .withIndex("by_status", (q) => q.eq("status", args.status!))
            .order("desc")
            .take(200)
        : await ctx.db.query("orders").order("desc").take(200);

    return await Promise.all(
      orders.map(async (order) => {
        const [items, customer] = await Promise.all([
          ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .take(200),
          ctx.db.get(order.userId),
        ]);
        return {
          ...order,
          itemCount: items.length,
          customer: {
            _id: order.userId,
            email: customer?.email ?? "",
            name: customer?.name ?? null,
          },
        };
      }),
    );
  },
});

export const getOne = query({
  args: { orderId: v.id("orders") },
  returns: v.union(orderDetailValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (order === null) {
      return null;
    }
    const customer = await ctx.db.get(order.userId);
    if (customer === null) {
      throw new Error("Order references a missing user");
    }
    const rawItems = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", order._id))
      .take(500);

    const items = await Promise.all(
      rawItems.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        const imageUrl =
          product?.imageStorageId !== undefined && product.imageStorageId
            ? await ctx.storage.getUrl(product.imageStorageId)
            : null;
        return {
          ...item,
          imageUrl,
          currentStock: product?.stock ?? null,
        };
      }),
    );

    return {
      ...order,
      customer: {
        _id: customer._id,
        clerkUserId: customer.clerkUserId,
        email: customer.email,
        name: customer.name ?? null,
        address: customer.address ?? null,
      },
      items,
    };
  },
});

const allowedTransitions: Record<
  "pending" | "paid" | "fulfilled" | "cancelled",
  ReadonlyArray<"pending" | "paid" | "fulfilled" | "cancelled">
> = {
  pending: ["paid", "cancelled"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

export const updateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: orderStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const order = await ctx.db.get(args.orderId);
    if (order === null) {
      throw new Error("Order not found");
    }
    if (order.status === args.status) {
      return null;
    }
    const allowed = allowedTransitions[order.status];
    if (!allowed.includes(args.status)) {
      throw new Error(
        `Cannot transition order from "${order.status}" to "${args.status}".`,
      );
    }
    await ctx.db.patch(args.orderId, { status: args.status });
    return null;
  },
});
