"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import { formatDateTime, formatPrice } from "@/components/admin/format";

const STATUS_BADGE: Record<
  "pending" | "paid" | "fulfilled" | "cancelled",
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  paid: "secondary",
  fulfilled: "default",
  cancelled: "destructive",
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const order = useQuery(api.admin.orders.getOne, {
    orderId: id as Id<"orders">,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/orders"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2",
          )}
        >
          <ArrowLeft />
          Back to orders
        </Link>
      </div>

      {order === undefined ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : order === null ? (
        <Card>
          <CardHeader>
            <CardTitle>Order not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This order may have been deleted or the link is invalid.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Order
                </h1>
                <Badge variant={STATUS_BADGE[order.status]}>
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Placed {formatDateTime(order.createdAt)} ·{" "}
                <span className="font-mono text-xs">{order._id}</span>
              </p>
            </div>
            <OrderStatusSelect orderId={order._id} status={order.status} />
          </header>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14"></TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>
                            <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt={item.nameSnapshot}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  —
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {item.nameSnapshot}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {item.currentStock !== null
                                  ? `${item.currentStock} in stock`
                                  : "Product removed"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatPrice(item.priceCentsSnapshot, order.currency)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatPrice(
                              item.priceCentsSnapshot * item.quantity,
                              order.currency,
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {order.items.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-6 text-center text-sm text-muted-foreground"
                          >
                            This order has no items.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Totals</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="text-right tabular-nums">
                      {formatPrice(order.subtotalCents, order.currency)}
                    </dd>
                    <dt className="text-muted-foreground">
                      Shipping{order.hadFreeShipping ? " (free)" : ""}
                    </dt>
                    <dd className="text-right tabular-nums">
                      {formatPrice(order.shippingCents, order.currency)}
                    </dd>
                    <dt className="font-medium">Total</dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {formatPrice(order.totalCents, order.currency)}
                    </dd>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">
                    {order.customer.name ?? "Guest"}
                  </span>
                  <span className="text-muted-foreground">
                    {order.customer.email}
                  </span>
                  <Separator className="my-3" />
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Shipping address
                  </span>
                  <address className="not-italic">
                    <div>{order.shippingAddress.fullName}</div>
                    <div>{order.shippingAddress.line1}</div>
                    {order.shippingAddress.line2 && (
                      <div>{order.shippingAddress.line2}</div>
                    )}
                    <div>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.region}{" "}
                      {order.shippingAddress.postalCode}
                    </div>
                    <div>{order.shippingAddress.country}</div>
                    {order.shippingAddress.phone && (
                      <div>{order.shippingAddress.phone}</div>
                    )}
                  </address>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stripe session</span>
                    <span className="truncate font-mono text-xs">
                      {order.stripeSessionId ?? "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment intent</span>
                    <span className="truncate font-mono text-xs">
                      {order.stripePaymentIntentId ?? "—"}
                    </span>
                  </div>
                  {order.reservedUntil && order.status === "pending" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Reserved until
                      </span>
                      <span className="text-xs">
                        {formatDateTime(order.reservedUntil)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
