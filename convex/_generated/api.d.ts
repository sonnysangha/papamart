/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin__helpers from "../admin/_helpers.js";
import type * as admin_categories from "../admin/categories.js";
import type * as admin_customers from "../admin/customers.js";
import type * as admin_dashboard from "../admin/dashboard.js";
import type * as admin_orders from "../admin/orders.js";
import type * as admin_products from "../admin/products.js";
import type * as categories from "../categories.js";
import type * as checkout from "../checkout.js";
import type * as crons from "../crons.js";
import type * as embeddings from "../embeddings.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/_helpers": typeof admin__helpers;
  "admin/categories": typeof admin_categories;
  "admin/customers": typeof admin_customers;
  "admin/dashboard": typeof admin_dashboard;
  "admin/orders": typeof admin_orders;
  "admin/products": typeof admin_products;
  categories: typeof categories;
  checkout: typeof checkout;
  crons: typeof crons;
  embeddings: typeof embeddings;
  favorites: typeof favorites;
  http: typeof http;
  orders: typeof orders;
  products: typeof products;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  stripe: import("@convex-dev/stripe/_generated/component.js").ComponentApi<"stripe">;
};
