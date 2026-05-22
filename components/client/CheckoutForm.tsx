"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Price from "@/components/client/Price";
import {
  setPendingCheckoutSession,
  useCartStore,
} from "@/lib/cart-store";
import { startCheckout } from "@/app/actions/checkout";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp";

const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK:
    "Some items don’t have enough stock. Please review your cart.",
  ADDRESS_REQUIRED: "Please add a shipping address before checking out.",
  CART_EMPTY: "Your cart is empty.",
  PRODUCT_UNAVAILABLE: "One of the products is no longer available.",
  USER_NOT_FOUND: "We couldn’t find your account. Please refresh and retry.",
  CURRENCY_MISMATCH: "Cart contains items from multiple currencies.",
  INVALID_QUANTITY: "Invalid quantity in cart.",
  NOT_SIGNED_IN: "Please sign in first.",
  CHECKOUT_FAILED: "Checkout failed. Please try again.",
};

export default function CheckoutForm() {
  const hasMounted = useCartStore((s) => s.hasMounted);
  const items = useCartStore((s) => s.items);
  const productIds = useMemo(() => items.map((it) => it.productId), [items]);

  const products = useQuery(
    api.products.getManyByIds,
    hasMounted && productIds.length > 0 ? { ids: productIds } : "skip",
  );

  const productMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof products>[number]>();
    (products ?? []).forEach((p) => map.set(p._id, p));
    return map;
  }, [products]);

  const { subtotalCents, currency, hasIssues } = useMemo(() => {
    let subtotal = 0;
    let issues = false;
    let curr = DEFAULT_CURRENCY;
    if (!products) {
      return { subtotalCents: 0, currency: curr, hasIssues: false };
    }
    for (const it of items) {
      const p = productMap.get(it.productId);
      if (!p) {
        issues = true;
        continue;
      }
      if (p.stock <= 0 || it.quantity > p.stock) {
        issues = true;
      }
      subtotal += p.priceCents * Math.min(it.quantity, p.stock);
      curr = p.currency;
    }
    return { subtotalCents: subtotal, currency: curr, hasIssues: issues };
  }, [items, products, productMap]);

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasMounted) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (items.length === 0) {
    return (
      <Alert>
        <AlertTitle>Your cart is empty</AlertTitle>
        <AlertDescription>
          <Link href="/search" className="underline">
            Browse products
          </Link>{" "}
          to add something.
        </AlertDescription>
      </Alert>
    );
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout({
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      });
      if (!result.ok) {
        const message = ERROR_MESSAGES[result.error] ?? result.error;
        setError(message);
        toast.error(message);
        return;
      }
      setPendingCheckoutSession(result.sessionId);
      window.location.assign(result.url);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Order summary
        </h2>
        <ul className="divide-y">
          {items.map((it) => {
            const p = productMap.get(it.productId);
            if (!p) {
              return (
                <li
                  key={it.productId}
                  className="flex items-center justify-between py-2 text-sm text-muted-foreground"
                >
                  <span>Item unavailable</span>
                  <span>×{it.quantity}</span>
                </li>
              );
            }
            const overstock = it.quantity > p.stock;
            return (
              <li
                key={it.productId}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {it.quantity} × <Price cents={p.priceCents} currency={p.currency} />
                    {overstock ? (
                      <Badge variant="destructive" className="ml-2">
                        Only {p.stock} left
                      </Badge>
                    ) : null}
                  </p>
                </div>
                <p className="font-medium tabular-nums">
                  <Price
                    cents={p.priceCents * it.quantity}
                    currency={p.currency}
                  />
                </p>
              </li>
            );
          })}
        </ul>
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">
            <Price cents={subtotalCents} currency={currency} />
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">
            Free for members · calculated on Stripe
          </span>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t start checkout</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {hasIssues ? (
        <Alert variant="destructive">
          <AlertTitle>Cart has issues</AlertTitle>
          <AlertDescription>
            Please fix stock issues in your cart before checking out.
          </AlertDescription>
        </Alert>
      ) : null}

      <Button
        size="lg"
        className="w-full"
        disabled={pending || hasIssues}
        onClick={handleSubmit}
      >
        {pending ? "Redirecting to Stripe…" : "Pay with Stripe"}
      </Button>
    </div>
  );
}
