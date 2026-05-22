import { v } from "convex/values";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import schema, { addressValidator } from "./schema";

const userDocValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  ...schema.tables.users.validator.fields,
});

async function getUserByClerkId(
  ctx: QueryCtx | MutationCtx,
  clerkUserId: string,
) {
  return await ctx.db
    .query("users")
    .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

export const currentUser = query({
  args: {},
  returns: v.union(userDocValidator, v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return await getUserByClerkId(ctx, identity.subject);
  },
});

export const ensureCurrent = mutation({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not signed in");
    }

    const existing = await getUserByClerkId(ctx, identity.subject);
    const email = identity.email;
    if (!email) {
      throw new Error(
        "Clerk identity is missing an email claim — cannot create Convex user. " +
          "Verify the Clerk JWT template includes the email scope.",
      );
    }
    const name = identity.name ?? undefined;
    const imageUrl =
      typeof identity.pictureUrl === "string" ? identity.pictureUrl : undefined;

    if (existing !== null) {
      const patch: Partial<Doc<"users">> = {};
      if (email && existing.email !== email) {
        patch.email = email;
      }
      if (name !== undefined && existing.name !== name) {
        patch.name = name;
      }
      if (imageUrl !== undefined && existing.imageUrl !== imageUrl) {
        patch.imageUrl = imageUrl;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email,
      name,
      imageUrl,
      createdAt: Date.now(),
    });
  },
});

export const setAddress = mutation({
  args: { address: addressValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not signed in");
    }
    const user = await getUserByClerkId(ctx, identity.subject);
    if (user === null) {
      throw new Error("User record not found. Try refreshing.");
    }
    await ctx.db.patch(user._id, { address: args.address });
    return null;
  },
});

export const syncFromClerk = internalMutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    const existing = await getUserByClerkId(ctx, args.clerkUserId);
    if (existing !== null) {
      const patch: Partial<Doc<"users">> = {};
      if (args.email && existing.email !== args.email) {
        patch.email = args.email;
      }
      if (args.name !== undefined && existing.name !== args.name) {
        patch.name = args.name;
      }
      if (args.imageUrl !== undefined && existing.imageUrl !== args.imageUrl) {
        patch.imageUrl = args.imageUrl;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(existing._id, patch);
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
      createdAt: Date.now(),
    });
  },
});
