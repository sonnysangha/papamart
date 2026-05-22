"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductCard from "@/components/client/ProductCard";

const ALL_CATEGORIES = "__all__";

export default function SearchPage() {
  const router = useRouter();
  const params = useSearchParams();
  const query = (params.get("q") ?? "").trim();
  const categorySlug = params.get("category") ?? ALL_CATEGORIES;

  const [draft, setDraft] = useState(query);

  const categories = useQuery(api.categories.list, {});
  const selectedCategory =
    categorySlug === ALL_CATEGORIES
      ? null
      : (categories?.find((c) => c.slug === categorySlug) ?? null);

  const results = useQuery(
    api.products.search,
    query.length === 0
      ? "skip"
      : selectedCategory
        ? { query, categoryId: selectedCategory._id }
        : { query },
  );

  function navigate(nextQuery: string, nextCategory: string) {
    const next = new URLSearchParams();
    if (nextQuery) next.set("q", nextQuery);
    if (nextCategory !== ALL_CATEGORIES) next.set("category", nextCategory);
    router.replace(`/search?${next.toString()}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    navigate(draft.trim(), categorySlug);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">
          Find products by name. Filter by category to narrow down.
        </p>
      </header>

      <form
        onSubmit={submit}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <InputGroup className="sm:flex-1">
          <InputGroupAddon align="inline-start">
            <SearchIcon className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search products"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          {draft.length > 0 ? (
            <InputGroupAddon align="inline-end">
              <button
                type="button"
                aria-label="Clear"
                onClick={() => {
                  setDraft("");
                  navigate("", categorySlug);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        <Select
          value={categorySlug}
          onValueChange={(value) =>
            navigate(draft.trim(), value ?? ALL_CATEGORIES)
          }
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c._id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="submit">Search</Button>
      </form>

      {query.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Type something above to start searching.
        </p>
      ) : results === undefined ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No matches for{" "}
          <span className="font-medium text-foreground">“{query}”</span>.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((p) => (
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
        </>
      )}
    </div>
  );
}
