import { v } from "convex/values";
import {
  internalMutation,
  type MutationCtx,
  type QueryCtx,
} from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

/**
 * Resolve the caller's Convex `users` doc and assert `role === "admin"`.
 * Throws on any failure so callers can rely on a non-null admin doc.
 *
 * Defence-in-depth alongside the role gate in `app/(admin)/admin/layout.tsx`:
 * every admin mutation/query re-verifies the caller from the server-side
 * Convex `users` table, never from a client-supplied argument.
 */
export async function requireAdmin(
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
    throw new Error("User record not found");
  }
  if (user.role !== "admin") {
    throw new Error("Forbidden: admin role required");
  }
  return user;
}

/**
 * Bootstrap mutation to grant or revoke admin role on a Convex `users` doc by
 * Clerk user id. Internal-only — call via Convex CLI:
 *
 *   npx convex run admin/_helpers:promoteToAdmin '{"clerkUserId":"user_xxx"}'
 *   npx convex run admin/_helpers:promoteToAdmin '{"clerkUserId":"user_xxx","role":null}'
 */
export const promoteToAdmin = internalMutation({
  args: {
    clerkUserId: v.string(),
    role: v.optional(v.union(v.literal("admin"), v.null())),
  },
  returns: v.object({
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.null()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) =>
        q.eq("clerkUserId", args.clerkUserId),
      )
      .unique();
    if (user === null) {
      throw new Error(
        `No Convex user found for clerkUserId="${args.clerkUserId}". ` +
          `The user must sign in once so EnsureUser/Clerk webhook creates their record.`,
      );
    }
    const nextRole = args.role === undefined ? "admin" : args.role;
    if (nextRole === null) {
      await ctx.db.patch(user._id, { role: undefined });
      return { userId: user._id, role: null };
    }
    await ctx.db.patch(user._id, { role: nextRole });
    return { userId: user._id, role: nextRole };
  },
});
