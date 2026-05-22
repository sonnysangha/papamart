"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm, {
  type ProductFormProduct,
} from "@/components/admin/ProductForm";
import { formatPrice } from "@/components/admin/format";

type AdminProduct = FunctionReturnType<typeof api.admin.products.list>[number];

function toFormProduct(product: AdminProduct): ProductFormProduct {
  return {
    _id: product._id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceCents: product.priceCents,
    categoryId: product.categoryId,
    stock: product.stock,
    unit: product.unit,
    isActive: product.isActive,
    imageUrl: product.imageUrl,
    imageStorageId: product.imageStorageId,
  };
}

export default function ProductsTable() {
  const [search, setSearch] = useState("");
  const products = useQuery(api.admin.products.list, {
    search: search.trim() ? search.trim() : undefined,
  });
  const removeProduct = useMutation(api.admin.products.remove);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState<Id<"products"> | null>(null);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(pendingDelete._id);
    try {
      await removeProduct({ productId: pendingDelete._id });
      toast.success(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete product";
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreate}>
          <Plus />
          New product
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products === undefined ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  {search.trim()
                    ? "No products match your search."
                    : "No products yet. Click \u201cNew product\u201d to add one."}
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <div className="flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt={product.name}
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
                      <span className="font-medium">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.slug} · {product.unit}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.categoryName ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPrice(product.priceCents, product.currency)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.stock}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.isActive ? "default" : "outline"}>
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Edit product"
                        onClick={() => openEdit(product)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete product"
                        onClick={() => setPendingDelete(product)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>
              {editing ? "Edit product" : "New product"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update product details, pricing, or stock."
                : "Add a new product to the catalog."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-4 pb-4">
            <ProductForm
              product={editing ? toFormProduct(editing) : undefined}
              onSuccess={() => setSheetOpen(false)}
              onCancel={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `This will permanently delete "${pendingDelete.name}". This action cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting !== null}
            >
              {deleting !== null && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
