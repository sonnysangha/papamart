"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import CartLine from "@/components/client/CartLine";
import Price from "@/components/client/Price";
import CheckoutGuard from "@/components/client/CheckoutGuard";
import { useCartStore } from "@/lib/cart-store";

const DEFAULT_CURRENCY =
  process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "gbp";

export default function CartPage() {
  const { isSignedIn } = useAuth();
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
    if (!products) {
      return {
        subtotalCents: 0,
        currency: DEFAULT_CURRENCY,
        hasIssues: false,
      };
    }
    let subtotal = 0;
    let issues = false;
    let curr = DEFAULT_CURRENCY;
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

  if (!hasMounted) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="mb-6 h-8 w-40" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <div className="rounded-full bg-muted p-4">
          <ShoppingCart className="size-8 text-muted-foreground" />
        </div>
        <h1 className="mt-6 text-xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add some groceries to get started.
        </p>
        <Link href="/search" className={cn(buttonVariants(), "mt-6")}>
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((it) => (
            <CartLine
              key={it.productId}
              productId={it.productId}
              quantity={it.quantity}
              product={productMap.get(it.productId)}
            />
          ))}
        </div>

        <aside className="space-y-4">
          {hasIssues ? (
            <Alert variant="destructive">
              <AlertTitle>Cart has issues</AlertTitle>
              <AlertDescription>
                Some lines are out of stock or quantities exceed availability.
                Please adjust before checkout.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                <Price cents={subtotalCents} currency={currency} />
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">
                Calculated at checkout
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>
                <Price cents={subtotalCents} currency={currency} />
              </span>
            </div>

            {isSignedIn ? (
              <CheckoutGuard nextPath="/checkout">
                <Link
                  href="/checkout"
                  className={cn(buttonVariants(), "w-full")}
                  aria-disabled={hasIssues}
                  onClick={(e) => {
                    if (hasIssues) {
                      e.preventDefault();
                    }
                  }}
                >
                  Proceed to checkout
                </Link>
              </CheckoutGuard>
            ) : (
              <Link href="/cart" className={cn(buttonVariants(), "w-full")}>
                Sign in to checkout
              </Link>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/search"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
