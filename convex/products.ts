import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema from "./schema";

const productWithImageFields = {
  _id: v.id("products"),
  _creationTime: v.number(),
  ...schema.tables.products.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
};

const productWithImageValidator = v.object(productWithImageFields);

async function withImage(ctx: QueryCtx, product: Doc<"products">) {
  return {
    ...product,
    imageUrl: product.imageStorageId
      ? await ctx.storage.getUrl(product.imageStorageId)
      : null,
  };
}

export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 24, 100);
    const products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .order("desc")
      .take(limit);

    return await Promise.all(products.map((p) => withImage(ctx, p)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(productWithImageValidator, v.null()),
  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (product === null) {
      return null;
    }
    return await withImage(ctx, product);
  },
});

export const byCategory = query({
  args: {
    categoryId: v.id("categories"),
    limit: v.optional(v.number()),
  },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 48, 100);
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .take(limit);

    const active = products.filter((p) => p.isActive);
    return await Promise.all(active.map((p) => withImage(ctx, p)));
  },
});

export const search = query({
  args: {
    query: v.string(),
    categoryId: v.optional(v.id("categories")),
    limit: v.optional(v.number()),
  },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args) => {
    const trimmed = args.query.trim();
    if (trimmed.length === 0) {
      return [];
    }
    const limit = Math.min(args.limit ?? 40, 100);

    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_name", (q) => {
        const base = q.search("name", trimmed).eq("isActive", true);
        if (args.categoryId !== undefined) {
          return base.eq("categoryId", args.categoryId);
        }
        return base;
      })
      .take(limit);

    return await Promise.all(results.map((p) => withImage(ctx, p)));
  },
});

export const getManyByIds = query({
  args: { ids: v.array(v.id("products")) },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args) => {
    const unique = Array.from(new Set(args.ids));
    const docs = await Promise.all(unique.map((id) => ctx.db.get(id)));
    const present = docs.filter(
      (doc): doc is Doc<"products"> => doc !== null,
    );
    return await Promise.all(present.map((p) => withImage(ctx, p)));
  },
});
