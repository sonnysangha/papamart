"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
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
import CategoryForm, {
  type CategoryFormCategory,
} from "@/components/admin/CategoryForm";

type AdminCategory = FunctionReturnType<
  typeof api.admin.categories.list
>[number];

function toFormCategory(category: AdminCategory): CategoryFormCategory {
  return {
    _id: category._id,
    name: category.name,
    slug: category.slug,
    sortOrder: category.sortOrder,
  };
}

export default function CategoriesTable() {
  const categories = useQuery(api.admin.categories.list, {});
  const removeCategory = useMutation(api.admin.categories.remove);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCategory | null>(
    null,
  );
  const [deleting, setDeleting] = useState<Id<"categories"> | null>(null);

  const openCreate = () => {
    setEditing(null);
    setSheetOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setEditing(category);
    setSheetOpen(true);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(pendingDelete._id);
    try {
      await removeCategory({ categoryId: pendingDelete._id });
      toast.success(`Deleted "${pendingDelete.name}"`);
      setPendingDelete(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete category";
      toast.error(message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button onClick={openCreate}>
          <Plus />
          New category
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Sort order</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="w-px"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories === undefined ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  No categories yet. Click &ldquo;New category&rdquo; to add
                  one.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {category.sortOrder}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {category.productCount}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Edit category"
                        onClick={() => openEdit(category)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete category"
                        onClick={() => setPendingDelete(category)}
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
        <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>
              {editing ? "Edit category" : "New category"}
            </SheetTitle>
            <SheetDescription>
              {editing
                ? "Update category name, slug, and sort order."
                : "Add a new category to group products."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-4 pb-4">
            <CategoryForm
              category={editing ? toFormCategory(editing) : undefined}
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
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `This will permanently delete "${pendingDelete.name}". Categories with products cannot be deleted.`
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
