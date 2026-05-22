import { v } from "convex/values";
import { embed } from "ai";
import { openai } from "@ai-sdk/openai";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

const EMBEDDING_MODEL = "text-embedding-3-small";

/**
 * Build the text we feed to the embedding model. Keeping this in one place so
 * the admin code path (update detection) and the action stay aligned: any field
 * that flows into this string must trigger re-embedding when it changes.
 */
function composeEmbeddingText(input: {
  name: string;
  description: string;
  categoryName: string;
}): string {
  return [
    input.name,
    input.description,
    input.categoryName ? `Category: ${input.categoryName}` : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

export const _getProductForEmbedding = internalQuery({
  args: { productId: v.id("products") },
  returns: v.union(
    v.object({
      name: v.string(),
      description: v.string(),
      categoryName: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      return null;
    }
    const category = await ctx.db.get(product.categoryId);
    return {
      name: product.name,
      description: product.description,
      categoryName: category?.name ?? "",
    };
  },
});

export const _setEmbedding = internalMutation({
  args: {
    productId: v.id("products"),
    embedding: v.array(v.float64()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (product === null) {
      return null;
    }
    await ctx.db.patch(args.productId, { embedding: args.embedding });
    return null;
  },
});

export const _listProductIdsMissingEmbedding = internalQuery({
  args: {},
  returns: v.array(v.id("products")),
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products
      .filter((p) => p.embedding === undefined)
      .map((p) => p._id);
  },
});

export const _listAllProductIds = internalQuery({
  args: {},
  returns: v.array(v.id("products")),
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.map((p) => p._id);
  },
});

export const generateForProduct = internalAction({
  args: { productId: v.id("products") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.runQuery(
      internal.embeddings._getProductForEmbedding,
      { productId: args.productId },
    );
    if (product === null) {
      return null;
    }
    const text = composeEmbeddingText(product);
    if (text.length === 0) {
      return null;
    }

    const { embedding } = await embed({
      model: openai.embedding(EMBEDDING_MODEL),
      value: text,
    });

    await ctx.runMutation(internal.embeddings._setEmbedding, {
      productId: args.productId,
      embedding,
    });
    return null;
  },
});

/**
 * Schedules `generateForProduct` for every product currently missing an
 * embedding. Uses the scheduler so each embed runs in its own action and we
 * don't blow past the action runtime limit for large catalogs.
 *
 * Pass `force: true` to re-embed every product even if one already exists
 * (useful after editing the embedding text composition).
 */
export const backfillAll = internalAction({
  args: { force: v.optional(v.boolean()) },
  returns: v.object({ scheduled: v.number() }),
  handler: async (ctx, args): Promise<{ scheduled: number }> => {
    const ids: Array<Id<"products">> = args.force
      ? await ctx.runQuery(internal.embeddings._listAllProductIds, {})
      : await ctx.runQuery(
        internal.embeddings._listProductIdsMissingEmbedding,
        {},
      );

    for (const productId of ids) {
      await ctx.scheduler.runAfter(
        0,
        internal.embeddings.generateForProduct,
        { productId },
      );
    }
    return { scheduled: ids.length };
  },
});
