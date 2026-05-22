"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/client/ProductCard";

type SimilarItem = {
  _id: Id<"products">;
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  unit: string;
  stock: number;
  imageUrl: string | null;
};

type SimilarItemsProps = {
  productId: Id<"products">;
  limit?: number;
};

export default function SimilarItems({
  productId,
  limit = 8,
}: SimilarItemsProps) {
  const findSimilar = useAction(api.products.findSimilar);
  // `undefined` = still loading; `null` = finished, nothing to show.
  const [items, setItems] = useState<SimilarItem[] | undefined | null>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    setItems(undefined);

    findSimilar({ productId, limit })
      .then((results) => {
        if (cancelled) return;
        setItems(results.length === 0 ? null : (results as SimilarItem[]));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("findSimilar failed", error);
        setItems(null);
      });

    return () => {
      cancelled = true;
    };
  }, [findSimilar, productId, limit]);

  if (items === null) {
    return null;
  }

  return (
    <section className="my-10">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">
        Similar items to this
      </h2>

      {items === undefined ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: Math.min(limit, 4) }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
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
  );
}
