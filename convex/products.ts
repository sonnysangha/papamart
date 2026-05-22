import { v } from "convex/values";
import {
  action,
  internalQuery,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
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

// ---------------------------------------------------------------------------
// Similar items — vector-search powered "you might also like" lookups.
// Implementation lives in this file so the public surface (`api.products.*`)
// stays in one place.
// ---------------------------------------------------------------------------

const DEFAULT_SIMILAR_LIMIT = 8;

export const _getEmbeddingForProduct = internalQuery({
  args: { productId: v.id("products") },
  returns: v.union(
    v.object({
      _id: v.id("products"),
      categoryId: v.id("categories"),
      embedding: v.union(v.array(v.float64()), v.null()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      return null;
    }
    return {
      _id: product._id,
      categoryId: product.categoryId,
      embedding: product.embedding ?? null,
    };
  },
});

export const _hydrateActiveByIds = internalQuery({
  args: { ids: v.array(v.id("products")) },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args) => {
    const docs = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    // Preserve the input order (it's already ranked by similarity score) and
    // drop anything that's been deleted or deactivated since the search.
    const active = docs.filter(
      (doc): doc is Doc<"products"> => doc !== null && doc.isActive,
    );
    return await Promise.all(active.map((p) => withImage(ctx, p)));
  },
});

export const _sameCategoryFallback = internalQuery({
  args: {
    productId: v.id("products"),
    categoryId: v.id("categories"),
    limit: v.number(),
  },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .take(args.limit + 1);

    const filtered = products
      .filter((p) => p.isActive && p._id !== args.productId)
      .slice(0, args.limit);

    return await Promise.all(filtered.map((p) => withImage(ctx, p)));
  },
});

/**
 * Returns products similar to `productId`, ranked by embedding cosine
 * similarity over the `by_embedding` vector index. Falls back to other
 * products in the same category if the source product has no embedding yet
 * (e.g. just created and the backfill action hasn't run).
 *
 * Vector search requires an action context — it cannot be a `query`.
 */
export const findSimilar = action({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  returns: v.array(productWithImageValidator),
  handler: async (ctx, args): Promise<Array<Doc<"products"> & {
    imageUrl: string | null;
  }>> => {
    const limit = Math.min(args.limit ?? DEFAULT_SIMILAR_LIMIT, 24);

    const source = await ctx.runQuery(internal.products._getEmbeddingForProduct, {
      productId: args.productId,
    });
    if (source === null) {
      return [];
    }

    if (source.embedding === null) {
      return await ctx.runQuery(internal.products._sameCategoryFallback, {
        productId: args.productId,
        categoryId: source.categoryId,
        limit,
      });
    }

    // +1 so we can drop the source product itself, which will be the top
    // result since it's a perfect match against its own embedding.
    const results = await ctx.vectorSearch("products", "by_embedding", {
      vector: source.embedding,
      limit: limit + 1,
      filter: (q) => q.eq("isActive", true),
    });

    const ids: Array<Id<"products">> = results
      .map((r) => r._id)
      .filter((id) => id !== args.productId)
      .slice(0, limit);

    if (ids.length === 0) {
      // Vector index might be empty (e.g. backfill never ran); fall back so
      // the section still shows something useful.
      return await ctx.runQuery(internal.products._sameCategoryFallback, {
        productId: args.productId,
        categoryId: source.categoryId,
        limit,
      });
    }

    return await ctx.runQuery(internal.products._hydrateActiveByIds, { ids });
  },
});
