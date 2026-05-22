"use client";

import { useQuery } from "convex/react";
import { Crown } from "lucide-react";

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
import { formatDate } from "@/components/admin/format";

export default function CustomersTable() {
  const customers = useQuery(api.admin.customers.listAll, {});

  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers === undefined ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={5}>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : customers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                No customers yet.
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer._id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {customer.name ?? "(no name)"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {customer.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer.address ? (
                    <span>
                      {customer.address.city}, {customer.address.country}
                    </span>
                  ) : (
                    <span className="italic">No address</span>
                  )}
                </TableCell>
                <TableCell>
                  {customer.role === "admin" ? (
                    <Badge>
                      <Crown />
                      Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">Customer</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {customer.orderCount}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(customer.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
