import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const addressValidator = v.object({
  fullName: v.string(),
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  region: v.string(),
  postalCode: v.string(),
  country: v.string(),
  phone: v.optional(v.string()),
});

export const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("paid"),
  v.literal("fulfilled"),
  v.literal("cancelled"),
);

export default defineSchema({
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.literal("admin")),
    stripeCustomerId: v.optional(v.string()),
    address: v.optional(addressValidator),
    createdAt: v.number(),
  }).index("by_clerk_user_id", ["clerkUserId"]),

  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    imageStorageId: v.optional(v.id("_storage")),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_sortOrder", ["sortOrder"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    priceCents: v.number(),
    currency: v.string(),
    categoryId: v.id("categories"),
    imageStorageId: v.optional(v.id("_storage")),
    stock: v.number(),
    unit: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId"])
    .index("by_active", ["isActive"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["categoryId", "isActive"],
    }),

  favorites: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),

  orders: defineTable({
    userId: v.id("users"),
    status: orderStatusValidator,
    stripeSessionId: v.optional(v.string()),
    stripePaymentIntentId: v.optional(v.string()),
    subtotalCents: v.number(),
    shippingCents: v.number(),
    totalCents: v.number(),
    currency: v.string(),
    hadFreeShipping: v.boolean(),
    shippingAddress: addressValidator,
    reservedUntil: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_stripe_session", ["stripeSessionId"])
    .index("by_reservedUntil", ["reservedUntil"]),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    nameSnapshot: v.string(),
    priceCentsSnapshot: v.number(),
    quantity: v.number(),
  }).index("by_order", ["orderId"]),
});
