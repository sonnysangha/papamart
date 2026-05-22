"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Price from "@/components/client/Price";
import AddToCartButton from "@/components/client/AddToCartButton";
import FavoriteButton from "@/components/client/FavoriteButton";
import SimilarItems from "@/components/client/SimilarItems";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function ProductPage({ params }: PageProps) {
  const { slug } = use(params);
  const product = useQuery(api.products.getBySlug, { slug });

  if (product === undefined) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-xl font-semibold">Product not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The product you’re looking for doesn’t exist or was removed.
        </p>
        <Link href="/" className="mt-4 inline-block text-sm underline">
          Back to home
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{product.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-6xl font-semibold text-muted-foreground">
              {product.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {product.name}
            </h1>
            <p className="text-sm text-muted-foreground">{product.unit}</p>
          </div>

          <div className="flex items-baseline gap-3">
            <p className="text-3xl font-semibold">
              <Price cents={product.priceCents} currency={product.currency} />
            </p>
            {outOfStock ? (
              <Badge variant="secondary">Out of stock</Badge>
            ) : product.stock < 10 ? (
              <Badge variant="outline">Only {product.stock} left</Badge>
            ) : (
              <Badge variant="outline">In stock</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <AddToCartButton
              productId={product._id}
              maxStock={product.stock}
              disabled={outOfStock}
            />
            <FavoriteButton productId={product._id} />
          </div>

          <Separator className="my-2" />

          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              About this product
            </h2>
            <p className="text-sm leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      <Separator className="my-10" />

      <SimilarItems productId={product._id} />
    </div>
  );
}
