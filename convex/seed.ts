import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ---------------------------------------------------------------------------
// Image attribution (Unsplash License — https://unsplash.com/license).
// All images below are hand-picked from Unsplash and verified to resolve
// against `images.unsplash.com` at the time this file was written. Attribution
// is courtesy under the Unsplash License (not required, but good practice).
//
// Categories
//   fresh-produce   photo-1576045057995-568f588f82fb  https://unsplash.com/photos/green-leafy-vegetables-4jpNPu7IW8k
//   bakery          photo-1623334044303-241021148842  https://unsplash.com/photos/a-bunch-of-croissants-that-are-on-a-table-sqkXyyj4WdE
//   dairy-and-eggs  photo-1635714293982-65445548ac42  https://unsplash.com/photos/a-large-number-of-cheeses-are-stacked-on-shelves-gW8WNdmGymA
//   pantry          photo-1645567454567-901dc409551b  https://unsplash.com/photos/a-row-of-jars-filled-with-different-types-of-food-e6PwBakXOJM
//   drinks          photo-1550951195-1311361a8954     https://unsplash.com/photos/four-green-glass-bottles-zIvpk0KvUm4
//
// Products
//   bananas              photo-1571771894821-ce9b6c11b08e  https://unsplash.com/photos/yellow-bananas-fczCr7MdE7U
//   avocado              photo-1519162808019-7de1683fa2ad  https://unsplash.com/photos/sliced-avocado-EMX1eJ1BcgU
//   baby-spinach-200g    photo-1578283326173-fbb0f83b59b2  https://unsplash.com/photos/green-leafy-vegetable-m6DAgQyxjAo
//   vine-tomatoes-500g   photo-1749776016335-374d2a350ec6  https://unsplash.com/photos/ripe-red-cherry-tomatoes-grow-on-a-vine-0lSx14ZJMGY
//   sourdough-loaf       photo-1559811814-e2c57b5e69df     https://unsplash.com/photos/sliced-of-baked-bread-beside-stainless-steel-bread-knife-IUk1S6n2s0o
//   butter-croissants-4pk photo-1681218079567-35aef7c8e7e4 https://unsplash.com/photos/a-croissant-sitting-on-top-of-a-cork-coaster-a4xoMVKzbak
//   bagels-6pk           photo-1772758631775-62f1912fe0f7  https://unsplash.com/photos/freshly-baked-bagels-steaming-on-a-baking-sheet-wXF-IKVjbqA
//   brioche-buns-4pk     photo-1632552544552-3ca612a328ac  https://unsplash.com/photos/a-close-up-of-a-tray-of-buns-9tPTZuqMsVY
//   whole-milk-2l        photo-1576186726188-c9d70843790f  https://unsplash.com/photos/milk-in-clear-glass-bottle-8Ox_f0GKesw
//   free-range-eggs-12pk photo-1773332585749-5146862ba746  https://unsplash.com/photos/carton-of-brown-eggs-on-a-kitchen-counter-e6W48UPKijo
//   salted-butter-250g   photo-1769689461246-6854e810dd64  https://unsplash.com/photos/person-spreading-butter-on-bread-at-a-table-UvU88ZEBzYI
//   greek-yoghurt-500g   photo-1581868164904-77b124b80242  https://unsplash.com/photos/clear-glass-jar-with-white-liquid-fIs9p9eTksw
//   penne-pasta-500g     photo-1767913338843-1ac3854e202e  https://unsplash.com/photos/penne-pasta-with-a-rich-red-sauce-and-spices-iZc7QLjqExA
//   olive-oil-500ml      photo-1474979266404-7eaacbcd87c5  https://unsplash.com/photos/clear-glass-cruet-bottle-uOBApnN_K7w
//   sea-salt-250g        photo-1769259398041-516cd768c62d  https://unsplash.com/photos/glass-jar-filled-with-coarse-salt-crystals-HGFWkn6PT8c
//   basmati-rice-1kg     photo-1777726041709-7e2875bfa0e0  https://unsplash.com/photos/close-up-of-fluffy-white-basmati-rice-grains-WRYcMUQWyRc
//   sparkling-water-1l   photo-1616118132534-381148898bb4  https://unsplash.com/photos/clear-plastic-bottle-on-white-table-edBR3b2JAuA
//   orange-juice-1l      photo-1600271886742-f049cd451bba  https://unsplash.com/photos/orange-juice-in-clear-drinking-glass-kkrXVKK-jhg
//   cold-brew-coffee-250ml photo-1756523851581-7756e07fe6a2 https://unsplash.com/photos/cold-brew-coffee-in-a-glass-bottle-with-straw-IgWlSmQCKRo
//   green-tea-bags-80pk  photo-1546648596-d8318bfcf491     https://unsplash.com/photos/tea-sachet-JjvLtQcegb0
// ---------------------------------------------------------------------------

const UNSPLASH_BASE = "https://images.unsplash.com/photo-";
const UNSPLASH_PARAMS = "?auto=format&fit=crop&w=1000&q=70";
const unsplash = (id: string) => `${UNSPLASH_BASE}${id}${UNSPLASH_PARAMS}`;

type CategorySeed = {
  name: string;
  slug: string;
  sortOrder: number;
  imageUrl: string;
};

type ProductSeed = {
  categorySlug: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stock: number;
  unit: string;
  imageUrl: string;
};

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    name: "Fresh Produce",
    slug: "fresh-produce",
    sortOrder: 10,
    imageUrl: unsplash("1576045057995-568f588f82fb"),
  },
  {
    name: "Bakery",
    slug: "bakery",
    sortOrder: 20,
    imageUrl: unsplash("1623334044303-241021148842"),
  },
  {
    name: "Dairy & Eggs",
    slug: "dairy-and-eggs",
    sortOrder: 30,
    imageUrl: unsplash("1635714293982-65445548ac42"),
  },
  {
    name: "Pantry",
    slug: "pantry",
    sortOrder: 40,
    imageUrl: unsplash("1645567454567-901dc409551b"),
  },
  {
    name: "Drinks",
    slug: "drinks",
    sortOrder: 50,
    imageUrl: unsplash("1550951195-1311361a8954"),
  },
];

const PRODUCT_SEEDS: ProductSeed[] = [
  {
    categorySlug: "fresh-produce",
    name: "Bananas",
    slug: "bananas",
    description: "Sweet Cavendish bananas, sold loose.",
    priceCents: 35,
    stock: 200,
    unit: "each",
    imageUrl: unsplash("1571771894821-ce9b6c11b08e"),
  },
  {
    categorySlug: "fresh-produce",
    name: "Avocado",
    slug: "avocado",
    description: "Ripe Hass avocados, perfect for toast.",
    priceCents: 120,
    stock: 80,
    unit: "each",
    imageUrl: unsplash("1519162808019-7de1683fa2ad"),
  },
  {
    categorySlug: "fresh-produce",
    name: "Baby Spinach 200g",
    slug: "baby-spinach-200g",
    description: "Tender baby spinach leaves, ready to eat.",
    priceCents: 175,
    stock: 60,
    unit: "200g bag",
    imageUrl: unsplash("1578283326173-fbb0f83b59b2"),
  },
  {
    categorySlug: "fresh-produce",
    name: "Vine Tomatoes 500g",
    slug: "vine-tomatoes-500g",
    description: "Sweet vine-ripened tomatoes on the stem.",
    priceCents: 220,
    stock: 50,
    unit: "500g",
    imageUrl: unsplash("1749776016335-374d2a350ec6"),
  },
  {
    categorySlug: "bakery",
    name: "Sourdough Loaf",
    slug: "sourdough-loaf",
    description: "Hand-shaped, slow-fermented sourdough loaf.",
    priceCents: 350,
    stock: 30,
    unit: "loaf",
    imageUrl: unsplash("1559811814-e2c57b5e69df"),
  },
  {
    categorySlug: "bakery",
    name: "Butter Croissants 4pk",
    slug: "butter-croissants-4pk",
    description: "All-butter croissants, baked this morning.",
    priceCents: 425,
    stock: 40,
    unit: "pack of 4",
    imageUrl: unsplash("1681218079567-35aef7c8e7e4"),
  },
  {
    categorySlug: "bakery",
    name: "Bagels 6pk",
    slug: "bagels-6pk",
    description: "Plain bagels, soft inside with a chewy crust.",
    priceCents: 250,
    stock: 35,
    unit: "pack of 6",
    imageUrl: unsplash("1772758631775-62f1912fe0f7"),
  },
  {
    categorySlug: "bakery",
    name: "Brioche Buns 4pk",
    slug: "brioche-buns-4pk",
    description: "Soft, buttery brioche buns for burgers.",
    priceCents: 240,
    stock: 30,
    unit: "pack of 4",
    imageUrl: unsplash("1632552544552-3ca612a328ac"),
  },
  {
    categorySlug: "dairy-and-eggs",
    name: "Whole Milk 2L",
    slug: "whole-milk-2l",
    description: "Fresh whole milk, 2 litre bottle.",
    priceCents: 175,
    stock: 80,
    unit: "2L bottle",
    imageUrl: unsplash("1576186726188-c9d70843790f"),
  },
  {
    categorySlug: "dairy-and-eggs",
    name: "Free-Range Eggs 12pk",
    slug: "free-range-eggs-12pk",
    description: "Large free-range eggs.",
    priceCents: 320,
    stock: 70,
    unit: "12 eggs",
    imageUrl: unsplash("1773332585749-5146862ba746"),
  },
  {
    categorySlug: "dairy-and-eggs",
    name: "Salted Butter 250g",
    slug: "salted-butter-250g",
    description: "Traditional churned salted butter.",
    priceCents: 230,
    stock: 60,
    unit: "250g block",
    imageUrl: unsplash("1769689461246-6854e810dd64"),
  },
  {
    categorySlug: "dairy-and-eggs",
    name: "Greek Yoghurt 500g",
    slug: "greek-yoghurt-500g",
    description: "Thick, creamy authentic Greek-style yoghurt.",
    priceCents: 285,
    stock: 50,
    unit: "500g tub",
    imageUrl: unsplash("1581868164904-77b124b80242"),
  },
  {
    categorySlug: "pantry",
    name: "Penne Pasta 500g",
    slug: "penne-pasta-500g",
    description: "Bronze-die Italian penne pasta.",
    priceCents: 130,
    stock: 120,
    unit: "500g",
    imageUrl: unsplash("1767913338843-1ac3854e202e"),
  },
  {
    categorySlug: "pantry",
    name: "Olive Oil 500ml",
    slug: "olive-oil-500ml",
    description: "Cold-pressed extra virgin olive oil.",
    priceCents: 650,
    stock: 45,
    unit: "500ml bottle",
    imageUrl: unsplash("1474979266404-7eaacbcd87c5"),
  },
  {
    categorySlug: "pantry",
    name: "Sea Salt 250g",
    slug: "sea-salt-250g",
    description: "Flaky sea salt, perfect for finishing.",
    priceCents: 180,
    stock: 90,
    unit: "250g",
    imageUrl: unsplash("1769259398041-516cd768c62d"),
  },
  {
    categorySlug: "pantry",
    name: "Basmati Rice 1kg",
    slug: "basmati-rice-1kg",
    description: "Long-grain basmati rice.",
    priceCents: 280,
    stock: 70,
    unit: "1kg bag",
    imageUrl: unsplash("1777726041709-7e2875bfa0e0"),
  },
  {
    categorySlug: "drinks",
    name: "Sparkling Water 1L",
    slug: "sparkling-water-1l",
    description: "Naturally sparkling mineral water.",
    priceCents: 90,
    stock: 200,
    unit: "1L bottle",
    imageUrl: unsplash("1616118132534-381148898bb4"),
  },
  {
    categorySlug: "drinks",
    name: "Orange Juice 1L",
    slug: "orange-juice-1l",
    description: "100% squeezed orange juice, not from concentrate.",
    priceCents: 295,
    stock: 60,
    unit: "1L carton",
    imageUrl: unsplash("1600271886742-f049cd451bba"),
  },
  {
    categorySlug: "drinks",
    name: "Cold Brew Coffee 250ml",
    slug: "cold-brew-coffee-250ml",
    description: "Smooth slow-steeped cold brew coffee.",
    priceCents: 285,
    stock: 50,
    unit: "250ml bottle",
    imageUrl: unsplash("1756523851581-7756e07fe6a2"),
  },
  {
    categorySlug: "drinks",
    name: "Green Tea Bags 80pk",
    slug: "green-tea-bags-80pk",
    description: "Sencha-style green tea bags.",
    priceCents: 340,
    stock: 40,
    unit: "80 bags",
    imageUrl: unsplash("1546648596-d8318bfcf491"),
  },
];

/**
 * Wipe `categories`, `products`, and dependent rows (`favorites`,
 * `orderItems`, `orders`) plus their referenced storage blobs so a reseed
 * starts from a clean slate without orphans or leaked storage.
 *
 * `.collect()` is appropriate here because seed data is small (≤ a few
 * hundred docs) and we explicitly want every row.
 */
export const _wipeCatalog = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    for (const row of await ctx.db.query("orderItems").collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("orders").collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("favorites").collect()) {
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("products").collect()) {
      if (row.imageStorageId) {
        await ctx.storage.delete(row.imageStorageId);
      }
      await ctx.db.delete(row._id);
    }
    for (const row of await ctx.db.query("categories").collect()) {
      if (row.imageStorageId) {
        await ctx.storage.delete(row.imageStorageId);
      }
      await ctx.db.delete(row._id);
    }
    return null;
  },
});

/**
 * Insert pre-uploaded categories and products. Called by the seeding action
 * after it has fetched and stored each image, so the mutation only does
 * single-transaction database writes (no network I/O).
 */
export const _insertCatalog = internalMutation({
  args: {
    categories: v.array(
      v.object({
        name: v.string(),
        slug: v.string(),
        sortOrder: v.number(),
        imageStorageId: v.id("_storage"),
      }),
    ),
    products: v.array(
      v.object({
        categorySlug: v.string(),
        name: v.string(),
        slug: v.string(),
        description: v.string(),
        priceCents: v.number(),
        stock: v.number(),
        unit: v.string(),
        imageStorageId: v.id("_storage"),
      }),
    ),
    currency: v.string(),
  },
  returns: v.object({
    categoriesInserted: v.number(),
    productsInserted: v.number(),
  }),
  handler: async (ctx, { categories, products, currency }) => {
    const slugToId = new Map<string, Id<"categories">>();
    for (const c of categories) {
      const id = await ctx.db.insert("categories", {
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        imageStorageId: c.imageStorageId,
      });
      slugToId.set(c.slug, id);
    }

    const now = Date.now();
    let productsInserted = 0;
    for (const p of products) {
      const categoryId = slugToId.get(p.categorySlug);
      if (!categoryId) {
        continue;
      }
      await ctx.db.insert("products", {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        currency,
        categoryId,
        imageStorageId: p.imageStorageId,
        stock: p.stock,
        unit: p.unit,
        isActive: true,
        createdAt: now,
      });
      productsInserted += 1;
    }

    return {
      categoriesInserted: categories.length,
      productsInserted,
    };
  },
});

async function fetchAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Image fetch failed: ${res.status} ${res.statusText} for ${url}`,
    );
  }
  return await res.blob();
}

/**
 * Shared seed implementation. Both `seedCatalogWithImages` and the
 * `seedCatalog` alias delegate here so we avoid an action-calling-action
 * round trip when the runtimes match.
 */
async function runSeedCatalogWithImages(ctx: ActionCtx): Promise<{
  categoriesInserted: number;
  productsInserted: number;
  imagesUploaded: number;
}> {
  const currency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp";

  await ctx.runMutation(internal.seed._wipeCatalog, {});

  const catEntries: Array<{
    name: string;
    slug: string;
    sortOrder: number;
    imageStorageId: Id<"_storage">;
  }> = [];
  for (const c of CATEGORY_SEEDS) {
    const blob = await fetchAsBlob(c.imageUrl);
    const storageId = await ctx.storage.store(blob);
    catEntries.push({
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      imageStorageId: storageId,
    });
  }

  const prodEntries: Array<{
    categorySlug: string;
    name: string;
    slug: string;
    description: string;
    priceCents: number;
    stock: number;
    unit: string;
    imageStorageId: Id<"_storage">;
  }> = [];
  for (const p of PRODUCT_SEEDS) {
    const blob = await fetchAsBlob(p.imageUrl);
    const storageId = await ctx.storage.store(blob);
    prodEntries.push({
      categorySlug: p.categorySlug,
      name: p.name,
      slug: p.slug,
      description: p.description,
      priceCents: p.priceCents,
      stock: p.stock,
      unit: p.unit,
      imageStorageId: storageId,
    });
  }

  const inserted: {
    categoriesInserted: number;
    productsInserted: number;
  } = await ctx.runMutation(internal.seed._insertCatalog, {
    categories: catEntries,
    products: prodEntries,
    currency,
  });

  // Generate vector embeddings for every freshly-seeded product. The
  // backfill schedules one action per product so it can't blow past the
  // single-action runtime limit and runs in parallel.
  await ctx.runAction(internal.embeddings.backfillAll, { force: true });

  return {
    categoriesInserted: inserted.categoriesInserted,
    productsInserted: inserted.productsInserted,
    imagesUploaded: catEntries.length + prodEntries.length,
  };
}

export const seedCatalogWithImages = internalAction({
  args: {},
  returns: v.object({
    categoriesInserted: v.number(),
    productsInserted: v.number(),
    imagesUploaded: v.number(),
  }),
  handler: (ctx) => runSeedCatalogWithImages(ctx),
});

/**
 * Backwards-compatible alias for the previous `seedCatalog` mutation. Kept
 * so `npx convex run seed:seedCatalog` still works for existing muscle
 * memory; new callers should prefer `seedCatalogWithImages`.
 */
export const seedCatalog = internalAction({
  args: {},
  returns: v.object({
    categoriesInserted: v.number(),
    productsInserted: v.number(),
    imagesUploaded: v.number(),
  }),
  handler: (ctx) => runSeedCatalogWithImages(ctx),
});
