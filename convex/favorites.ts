import { v } from "convex/values";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";

const productDocValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
  ...schema.tables.products.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
});

async function getCurrentUserOrThrow(
  ctx: QueryCtx | MutationCtx,
): Promise<Doc<"users">> {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw new Error("Not signed in");
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", identity.subject))
    .unique();
  if (user === null) {
    throw new Error("User record not found. Try refreshing.");
  }
  return user;
}

export const listMine = query({
  args: {},
  returns: v.array(productDocValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return [];
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject),
      )
      .unique();
    if (user === null) {
      return [];
    }
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);

    const products = await Promise.all(
      favorites.map((f) => ctx.db.get(f.productId)),
    );
    const present = products.filter(
      (p): p is Doc<"products"> => p !== null && p.isActive,
    );
    return await Promise.all(
      present.map(async (p) => ({
        ...p,
        imageUrl: p.imageStorageId
          ? await ctx.storage.getUrl(p.imageStorageId)
          : null,
      })),
    );
  },
});

export const isFavorited = query({
  args: { productId: v.id("products") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return false;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", identity.subject),
      )
      .unique();
    if (user === null) {
      return false;
    }
    const fav = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    return fav !== null;
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", user._id).eq("productId", args.productId),
      )
      .unique();
    if (existing !== null) {
      await ctx.db.delete(existing._id);
      return false;
    }
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      throw new Error("Product not found");
    }
    await ctx.db.insert("favorites", {
      userId: user._id,
      productId: args.productId,
      createdAt: Date.now(),
    });
    return true;
  },
});
