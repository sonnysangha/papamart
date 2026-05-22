import { v } from "convex/values";
import { query } from "./_generated/server";
import schema from "./schema";

const categoryWithImageValidator = v.object({
  _id: v.id("categories"),
  _creationTime: v.number(),
  ...schema.tables.categories.validator.fields,
  imageUrl: v.union(v.string(), v.null()),
});

export const list = query({
  args: {},
  returns: v.array(categoryWithImageValidator),
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_sortOrder")
      .order("asc")
      .take(100);

    return await Promise.all(
      categories.map(async (category) => ({
        ...category,
        imageUrl: category.imageStorageId
          ? await ctx.storage.getUrl(category.imageStorageId)
          : null,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(categoryWithImageValidator, v.null()),
  handler: async (ctx, args) => {
    const category = await ctx.db
      .query("categories")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (category === null) {
      return null;
    }

    return {
      ...category,
      imageUrl: category.imageStorageId
        ? await ctx.storage.getUrl(category.imageStorageId)
        : null,
    };
  },
});
