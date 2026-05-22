import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import schema from "../schema";
import { requireAdmin } from "./_helpers";

const adminCategoryValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  ...schema.tables.categories.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
  productCount: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(adminCategoryValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .order("asc")
      .take(200);

    return await Promise.all(
      categories.map(async (category) => {
        const products = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("categoryId", category._id))
          .take(200);
        return {
          ...category,
          imageUrl: category.imageStorageId
            ? await ctx.storage.getUrl(category.imageStorageId)
            : null,
          productCount: products.length,
        };
      }),
    );
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    sortOrder: v.number(),
    imageStorageId: v.optional(v.id("_storage")),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    const slug = args.slug.trim();
    if (name.length === 0) {
      throw new Error("Category name is required");
    }
    if (slug.length === 0) {
      throw new Error("Category slug is required");
    }
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing !== null) {
      throw new Error(`A category with slug "${slug}" already exists`);
    }
    return await ctx.db.insert("categories", {
      name,
      slug,
      sortOrder: args.sortOrder,
      imageStorageId: args.imageStorageId,
    });
  },
});

export const update = mutation({
  args: {
    categoryId: v.id("categories"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      throw new Error("Category not found");
    }
    const patch: Partial<Doc<"categories">> = {};

    if (args.name !== undefined) {
      const trimmed = args.name.trim();
      if (trimmed.length === 0) {
        throw new Error("Category name is required");
      }
      patch.name = trimmed;
    }
    if (args.slug !== undefined && args.slug.trim() !== category.slug) {
      const trimmedSlug = args.slug.trim();
      if (trimmedSlug.length === 0) {
        throw new Error("Category slug is required");
      }
      const dup = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", trimmedSlug))
        .unique();
      if (dup !== null && dup._id !== category._id) {
        throw new Error(`A category with slug "${trimmedSlug}" already exists`);
      }
      patch.slug = trimmedSlug;
    }
    if (args.sortOrder !== undefined) {
      patch.sortOrder = args.sortOrder;
    }
    if (args.imageStorageId !== undefined) {
      patch.imageStorageId = args.imageStorageId ?? undefined;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.categoryId, patch);
    }
    return null;
  },
});

export const remove = mutation({
  args: { categoryId: v.id("categories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const category = await ctx.db.get(args.categoryId);
    if (category === null) {
      return null;
    }
    const linked = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .take(1);
    if (linked.length > 0) {
      throw new Error(
        "This category still has products. Move or delete its products first.",
      );
    }
    await ctx.db.delete(args.categoryId);
    return null;
  },
});
