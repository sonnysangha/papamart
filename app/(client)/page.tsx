"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import CategoryCard from "@/components/client/CategoryCard";
import ProductCard from "@/components/client/ProductCard";

export default function HomePage() {
  const categories = useQuery(api.categories.list, {});
  const featured = useQuery(api.products.list, { limit: 8 });

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="relative my-8 overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary p-8 sm:my-10 sm:p-14">
        <div className="max-w-xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Fresh, every day
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your friendly neighbourhood grocery, online.
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Shop fresh produce, bakery, pantry and drinks — delivered to your
            door. Join our membership for free shipping on every order.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/search" className={cn(buttonVariants())}>
              Start shopping
            </Link>
            <Link
              href="/membership"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Membership
            </Link>
          </div>
        </div>
      </section>

      <section className="my-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Shop by category
          </h2>
        </div>
        {categories === undefined ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No categories yet. Run the seed mutation to populate the catalog.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c) => (
              <CategoryCard
                key={c._id}
                name={c.name}
                slug={c.slug}
                imageUrl={c.imageUrl}
              />
            ))}
          </div>
        )}
      </section>

      <section className="my-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Featured</h2>
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            View all
          </Link>
        </div>
        {featured === undefined ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No products yet. Add some via the admin panel or run the seed
            mutation.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard
                key={p._id}
                name={p.name}
                slug={p.slug}
                priceCents={p.priceCents}
                currency={p.currency}
                unit={p.unit}
                stock={p.stock}
                imageUrl={p.imageUrl}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
