"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/client/ProductCard";

export default function FavouritesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const favorites = useQuery(
    api.favorites.listMine,
    isLoaded && isSignedIn ? {} : "skip",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Favourites</h1>
        <p className="text-sm text-muted-foreground">
          Products you’ve saved for later.
        </p>
      </header>

      {!isLoaded || (isSignedIn && favorites === undefined) ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : !isSignedIn ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Heart className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Sign in to save your favourite products.
          </p>
        </div>
      ) : favorites && favorites.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
            <Heart className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            You haven’t saved anything yet.
          </p>
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {favorites?.map((p) => (
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
    </div>
  );
}
