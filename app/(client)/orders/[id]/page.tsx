"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Price from "@/components/client/Price";
import type { Doc, Id } from "@/convex/_generated/dataModel";

const STATUS_VARIANT: Record<
  Doc<"orders">["status"],
  "default" | "outline" | "secondary" | "destructive"
> = {
  pending: "outline",
  paid: "default",
  fulfilled: "secondary",
  cancelled: "destructive",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default function OrderDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const orderId = id as Id<"orders">;
  const { isLoaded, isSignedIn } = useAuth();
  const data = useQuery(
    api.orders.getMine,
    isLoaded && isSignedIn ? { orderId } : "skip",
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link
              href="/orders"
              className="transition-colors hover:text-foreground"
            >
              Orders
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{orderId.slice(-8)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {!isLoaded || (isSignedIn && data === undefined) ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : !isSignedIn ? (
        <p className="text-sm text-muted-foreground">
          Please sign in to see this order.
        </p>
      ) : !data ? (
        <p className="text-sm text-muted-foreground">
          Order not found.{" "}
          <Link href="/orders" className="underline">
            See all orders
          </Link>
          .
        </p>
      ) : (
        <>
          <header className="mb-6 space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Order #{data.order._id.slice(-8)}
              </h1>
              <Badge variant={STATUS_VARIANT[data.order.status]}>
                {data.order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Placed on{" "}
              {new Date(data.order.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </header>

          <section className="mb-6 rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Items
            </h2>
            <ul className="mt-2 divide-y">
              {data.items.map((item) => (
                <li
                  key={item._id}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">{item.nameSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} ×{" "}
                      <Price
                        cents={item.priceCentsSnapshot}
                        currency={data.order.currency}
                      />
                    </p>
                  </div>
                  <p className="font-medium tabular-nums">
                    <Price
                      cents={item.priceCentsSnapshot * item.quantity}
                      currency={data.order.currency}
                    />
                  </p>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  <Price
                    cents={data.order.subtotalCents}
                    currency={data.order.currency}
                  />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Shipping {data.order.hadFreeShipping ? "(member)" : ""}
                </span>
                <span>
                  {data.order.shippingCents === 0 ? (
                    "Free"
                  ) : (
                    <Price
                      cents={data.order.shippingCents}
                      currency={data.order.currency}
                    />
                  )}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>
                  <Price
                    cents={data.order.totalCents}
                    currency={data.order.currency}
                  />
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Shipping to
            </h2>
            <address className="mt-2 not-italic text-sm leading-relaxed">
              {data.order.shippingAddress.fullName}
              <br />
              {data.order.shippingAddress.line1}
              {data.order.shippingAddress.line2 ? (
                <>
                  <br />
                  {data.order.shippingAddress.line2}
                </>
              ) : null}
              <br />
              {data.order.shippingAddress.city},{" "}
              {data.order.shippingAddress.region}{" "}
              {data.order.shippingAddress.postalCode}
              <br />
              {data.order.shippingAddress.country}
              {data.order.shippingAddress.phone ? (
                <>
                  <br />
                  <span className="text-muted-foreground">
                    {data.order.shippingAddress.phone}
                  </span>
                </>
              ) : null}
            </address>
          </section>
        </>
      )}
    </div>
  );
}
