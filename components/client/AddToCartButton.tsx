"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import type { Id } from "@/convex/_generated/dataModel";

type AddToCartButtonProps = {
  productId: Id<"products">;
  maxStock: number;
  disabled?: boolean;
};

export default function AddToCartButton({
  productId,
  maxStock,
  disabled,
}: AddToCartButtonProps) {
  const hasMounted = useCartStore((s) => s.hasMounted);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const [pending, setPending] = useState(false);

  const existing = hasMounted
    ? items.find((it) => it.productId === productId)
    : undefined;
  const currentQty = existing?.quantity ?? 0;

  if (!hasMounted) {
    return (
      <Button disabled size="lg">
        <ShoppingCart className="size-4" />
        Add to cart
      </Button>
    );
  }

  if (currentQty === 0) {
    return (
      <Button
        size="lg"
        disabled={disabled || pending}
        onClick={() => {
          setPending(true);
          try {
            addItem(productId, 1, maxStock);
            toast.success("Added to cart");
          } catch (err) {
            console.error(err);
            toast.error("Could not add to cart");
          } finally {
            setPending(false);
          }
        }}
      >
        <ShoppingCart className="size-4" />
        Add to cart
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-md border bg-background p-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Decrease quantity"
        onClick={() => setQuantity(productId, currentQty - 1, maxStock)}
      >
        <Minus className="size-4" />
      </Button>
      <span className="min-w-8 text-center text-sm font-medium tabular-nums">
        {currentQty}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Increase quantity"
        disabled={currentQty >= maxStock}
        onClick={() => setQuantity(productId, currentQty + 1, maxStock)}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
