"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ProductForm from "@/components/admin/ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const product = useQuery(api.admin.products.getOne, {
    productId: id as Id<"products">,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Edit product</h1>
        <p className="text-sm text-muted-foreground">
          Update product details, pricing, or stock.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>
            {product === undefined
              ? "Loading…"
              : product === null
                ? "Product not found"
                : product.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {product === undefined ? (
            <div className="space-y-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-2/3" />
            </div>
          ) : product === null ? (
            <p className="text-sm text-muted-foreground">
              This product no longer exists. It may have been deleted.
            </p>
          ) : (
            <ProductForm
              product={{
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
              }}
              onSuccess={() => router.push("/admin/products")}
              onCancel={() => router.push("/admin/products")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
