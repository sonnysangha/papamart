"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Price from "@/components/client/Price";
import {
  setPendingCheckoutSession,
  useCartStore,
} from "@/lib/cart-store";

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const clear = useCartStore((s) => s.clear);
  const hasMounted = useCartStore((s) => s.hasMounted);

  const order = useQuery(
    api.orders.getBySessionId,
    sessionId ? { sessionId } : "skip",
  );

  const didClearRef = useRef(false);
  useEffect(() => {
    if (!hasMounted || didClearRef.current) return;
    if (order && order.status === "paid") {
      didClearRef.current = true;
      clear();
      setPendingCheckoutSession(null);
    }
  }, [order, hasMounted, clear]);

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold">Missing session</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn’t find a checkout session. Try going back to{" "}
          <Link href="/cart" className="underline">
            your cart
          </Link>
          .
        </p>
      </div>
    );
  }

  if (order === undefined) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Confirming your payment…
        </p>
      </div>
    );
  }

  if (order === null) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">
          Waiting for the order to appear. This usually takes a second.
        </p>
      </div>
    );
  }

  const paid = order.status === "paid" || order.status === "fulfilled";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Card className="text-center">
        <CardContent className="space-y-4 p-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
            {paid ? (
              <CheckCircle2 className="size-7 text-emerald-600" />
            ) : (
              <Loader2 className="size-7 animate-spin text-muted-foreground" />
            )}
          </div>
          <h1 className="text-xl font-semibold">
            {paid ? "Order confirmed" : "Finalising your order…"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {paid
              ? "Thanks for shopping with Papamart. We’ll get this packed for you."
              : "Stripe is letting us know about your payment. Sit tight."}
          </p>
          <div className="space-y-1 pt-2 text-sm">
            <p>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold">
                <Price cents={order.totalCents} currency={order.currency} />
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Order ID: {order._id}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <Link
              href={`/orders/${order._id}`}
              className={cn(buttonVariants(), "min-w-32")}
            >
              View order
            </Link>
            <Link
              href="/search"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-w-32",
              )}
            >
              Keep shopping
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
