"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDateTime, formatPrice } from "@/components/admin/format";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
] as const;

type StatusFilter = (typeof STATUSES)[number]["value"];

const STATUS_BADGE: Record<
  "pending" | "paid" | "fulfilled" | "cancelled",
  "default" | "secondary" | "outline" | "destructive"
> = {
  pending: "outline",
  paid: "secondary",
  fulfilled: "default",
  cancelled: "destructive",
};

export default function OrdersTable() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const orders = useQuery(api.admin.orders.listAll, {
    status:
      filter === "all"
        ? undefined
        : (filter as "pending" | "paid" | "fulfilled" | "cancelled"),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <Select
            value={filter}
            onValueChange={(v) => {
              if (v !== null) setFilter(v as StatusFilter);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing the latest 200 orders
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-px"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders === undefined ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {order.customer.name ?? "Guest"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {order.customer.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[order.status]}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPrice(order.totalCents, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order._id}`}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                      )}
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
