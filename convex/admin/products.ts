import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import schema from "../schema";
import { requireAdmin } from "./_helpers";

const adminProductValidator = v.object({
  _id: v.id("products"),
  _creationTime: v.number(),
  ...schema.tables.products.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
  categoryName: v.union(v.string(), v.null()),
});

async function hydrate(ctx: QueryCtx, product: Doc<"products">) {
  const [imageUrl, category] = await Promise.all([
    product.imageStorageId
      ? ctx.storage.getUrl(product.imageStorageId)
      : Promise.resolve(null),
    ctx.db.get(product.categoryId),
  ]);
  return {
    ...product,
    imageUrl,
    categoryName: category?.name ?? null,
  };
}

export const list = query({
  args: { search: v.optional(v.string()) },
  returns: v.array(adminProductValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const trimmed = args.search?.trim() ?? "";

    const products =
      trimmed.length > 0
        ? await ctx.db
            .query("products")
            .withSearchIndex("search_name", (q) => q.search("name", trimmed))
            .take(100)
        : await ctx.db
            .query("products")
            .withIndex("by_active")
            .order("desc")
            .take(200);

    return await Promise.all(products.map((p) => hydrate(ctx, p)));
  },
});

export const getOne = query({
  args: { productId: v.id("products") },
  returns: v.union(adminProductValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      return null;
    }
    return await hydrate(ctx, product);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    priceCents: v.number(),
    categoryId: v.id("categories"),
    imageStorageId: v.optional(v.id("_storage")),
    stock: v.number(),
    unit: v.string(),
    isActive: v.boolean(),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.name.trim().length === 0) {
      throw new Error("Product name is required");
    }
    if (args.slug.trim().length === 0) {
      throw new Error("Product slug is required");
    }
    if (args.priceCents < 0) {
      throw new Error("Price cannot be negative");
    }
    if (args.stock < 0) {
      throw new Error("Stock cannot be negative");
    }

    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing !== null) {
      throw new Error(`A product with slug "${args.slug}" already exists`);
    }

    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      throw new Error("Category not found");
    }

    const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp";

    return await ctx.db.insert("products", {
      name: args.name.trim(),
      slug: args.slug.trim(),
      description: args.description,
      priceCents: Math.round(args.priceCents),
      currency,
      categoryId: args.categoryId,
      imageStorageId: args.imageStorageId,
      stock: Math.round(args.stock),
      unit: args.unit.trim(),
      isActive: args.isActive,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    priceCents: v.optional(v.number()),
    categoryId: v.optional(v.id("categories")),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    stock: v.optional(v.number()),
    unit: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const product = await ctx.db.get(args.productId);
    if (product === null) {
      throw new Error("Product not found");
    }

    const patch: Partial<Doc<"products">> = {};

    if (args.name !== undefined) {
      if (args.name.trim().length === 0) {
        throw new Error("Product name is required");
      }
      patch.name = args.name.trim();
    }
    if (args.slug !== undefined && args.slug !== product.slug) {
      const trimmedSlug = args.slug.trim();
      if (trimmedSlug.length === 0) {
        throw new Error("Product slug is required");
      }
      const dup = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", trimmedSlug))
        .unique();
      if (dup !== null && dup._id !== product._id) {
        throw new Error(`A product with slug "${trimmedSlug}" already exists`);
      }
      patch.slug = trimmedSlug;
    }
    if (args.description !== undefined) {
      patch.description = args.description;
    }
    if (args.priceCents !== undefined) {
      if (args.priceCents < 0) {
        throw new Error("Price cannot be negative");
      }
      patch.priceCents = Math.round(args.priceCents);
    }
    if (args.categoryId !== undefined) {
      const category = await ctx.db.get(args.categoryId);
      if (category === null) {
        throw new Error("Category not found");
      }
      patch.categoryId = args.categoryId;
    }
    if (args.imageStorageId !== undefined) {
      patch.imageStorageId = args.imageStorageId ?? undefined;
    }
    if (args.stock !== undefined) {
      if (args.stock < 0) {
        throw new Error("Stock cannot be negative");
      }
      patch.stock = Math.round(args.stock);
    }
    if (args.unit !== undefined) {
      patch.unit = args.unit.trim();
    }
    if (args.isActive !== undefined) {
      patch.isActive = args.isActive;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.productId, patch);
    }
    return null;
  },
});

export const remove = mutation({
  args: { productId: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      return null;
    }
    await ctx.db.delete(args.productId);
    return null;
  },
});

export const setStock = mutation({
  args: {
    productId: v.id("products"),
    stock: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.stock < 0) {
      throw new Error("Stock cannot be negative");
    }
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      throw new Error("Product not found");
    }
    await ctx.db.patch(args.productId, { stock: Math.round(args.stock) });
    return null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});
