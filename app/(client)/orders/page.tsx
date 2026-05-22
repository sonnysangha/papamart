"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Price from "@/components/client/Price";
import type { Doc } from "@/convex/_generated/dataModel";

const STATUS_VARIANT: Record<
  Doc<"orders">["status"],
  "default" | "outline" | "secondary" | "destructive"
> = {
  pending: "outline",
  paid: "default",
  fulfilled: "secondary",
  cancelled: "destructive",
};

export default function OrdersPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const orders = useQuery(
    api.orders.listMine,
    isLoaded && isSignedIn ? {} : "skip",
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My orders</h1>
        <p className="text-sm text-muted-foreground">
          Your recent orders, freshest first.
        </p>
      </header>

      {!isLoaded || (isSignedIn && orders === undefined) ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !isSignedIn ? (
        <p className="text-sm text-muted-foreground">
          Please sign in to see your orders.
        </p>
      ) : !orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
          <Link
            href="/search"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>
                  <Link
                    href={`/orders/${order._id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    #{order._id.slice(-8)}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status]}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  <Price
                    cents={order.totalCents}
                    currency={order.currency}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
