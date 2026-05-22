"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ORDER_STATUSES = ["pending", "paid", "fulfilled", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const ALLOWED_NEXT: Record<OrderStatus, OrderStatus[]> = {
  pending: ["pending", "paid", "cancelled"],
  paid: ["paid", "fulfilled", "cancelled"],
  fulfilled: ["fulfilled"],
  cancelled: ["cancelled"],
};

const LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: Id<"orders">;
  status: OrderStatus;
}) {
  const updateStatus = useMutation(api.admin.orders.updateStatus);
  const [pending, setPending] = useState(false);

  const allowed = ALLOWED_NEXT[status];

  const onValueChange = async (next: string | null) => {
    if (next === null || next === status) return;
    if (!ORDER_STATUSES.includes(next as OrderStatus)) return;
    setPending(true);
    try {
      await updateStatus({ orderId, status: next as OrderStatus });
      toast.success(`Order marked as ${LABEL[next as OrderStatus]}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={onValueChange} disabled={pending}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem
              key={s}
              value={s}
              disabled={!allowed.includes(s) && s !== status}
            >
              {LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
