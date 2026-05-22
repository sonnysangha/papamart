"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import ProductCard from "@/components/client/ProductCard";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default function CategoryPage({ params }: PageProps) {
  const { slug } = use(params);
  const category = useQuery(api.categories.getBySlug, { slug });
  const products = useQuery(
    api.products.byCategory,
    category ? { categoryId: category._id } : "skip",
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
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
            <BreadcrumbPage>
              {category === undefined
                ? "Loading…"
                : category === null
                  ? "Not found"
                  : category.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {category === undefined ? (
        <Skeleton className="mb-6 h-8 w-48" />
      ) : category === null ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <h1 className="text-lg font-semibold">Category not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Try browsing all{" "}
            <Link href="/" className="underline">
              categories
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <header className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {category.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse our {category.name.toLowerCase()} selection.
            </p>
          </header>

          {products === undefined ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="aspect-square w-full rounded-xl"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing in this category yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  name={p.name}
                  slug={p.slug}
                  priceCents={p.priceCents}
                  currency={p.currency}
                  unit={p.unit}
                  stock={p.stock}
                  imageUrl={p.imageUrl}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
