import { v } from "convex/values";
import { query } from "../_generated/server";
import schema from "../schema";
import { requireAdmin } from "./_helpers";

const adminCustomerValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  ...schema.tables.users.validator.fields,
  orderCount: v.number(),
});

export const listAll = query({
  args: {},
  returns: v.array(adminCustomerValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").order("desc").take(500);

    return await Promise.all(
      users.map(async (user) => {
        const orders = await ctx.db
          .query("orders")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .take(500);
        return {
          ...user,
          orderCount: orders.length,
        };
      }),
    );
  },
});
