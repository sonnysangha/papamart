"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Price from "@/components/client/Price";
import { useCartStore } from "@/lib/cart-store";
import type { Doc, Id } from "@/convex/_generated/dataModel";

type ProductWithImage = Doc<"products"> & { imageUrl: string | null };

type CartLineProps = {
  productId: Id<"products">;
  quantity: number;
  product: ProductWithImage | undefined;
};

export default function CartLine({
  productId,
  quantity,
  product,
}: CartLineProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (product === undefined) {
    return (
      <div className="flex items-center gap-4 rounded-lg border bg-card p-3 text-sm text-muted-foreground">
        <div className="size-16 animate-pulse rounded-md bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const overStock = quantity > product.stock;
  const lineTotal = product.priceCents * quantity;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:gap-4">
      <Link
        href={`/products/${product.slug}`}
        className="size-20 shrink-0 overflow-hidden rounded-md bg-muted"
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
            {product.name.charAt(0)}
          </div>
        )}
      </Link>

      <div className="flex-1 space-y-1">
        <Link
          href={`/products/${product.slug}`}
          className="block text-sm font-medium hover:underline"
        >
          {product.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          <Price cents={product.priceCents} currency={product.currency} /> ·{" "}
          {product.unit}
        </p>
        {outOfStock ? (
          <Badge variant="destructive">Out of stock</Badge>
        ) : overStock ? (
          <Badge variant="destructive">
            Only {product.stock} in stock
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="inline-flex items-center gap-1 rounded-md border bg-background p-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            onClick={() =>
              setQuantity(productId, quantity - 1, product.stock)
            }
          >
            <Minus className="size-4" />
          </Button>
          <span className="min-w-8 text-center text-sm font-medium tabular-nums">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            disabled={quantity >= product.stock}
            onClick={() =>
              setQuantity(productId, quantity + 1, product.stock)
            }
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="w-20 text-right text-sm font-semibold tabular-nums">
          <Price cents={lineTotal} currency={product.currency} />
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Remove from cart"
          onClick={() => removeItem(productId)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
