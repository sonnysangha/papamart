"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Search as SearchIcon, ShoppingCart } from "lucide-react";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/cart-store";

export default function Header() {
  const hasMounted = useCartStore((s) => s.hasMounted);
  const itemCount = useCartStore((s) =>
    s.items.reduce((acc, it) => acc + it.quantity, 0),
  );
  const showBadge = hasMounted && itemCount > 0;

  const router = useRouter();
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const [draft, setDraft] = useState(initialQuery);

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    const q = draft.trim();
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    router.push(`/search${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span>Papamart</span>
        </Link>

        <form
          onSubmit={submitSearch}
          role="search"
          aria-label="Search products"
          className="hidden flex-1 max-w-md md:block"
        >
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <SearchIcon className="size-4 text-muted-foreground" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search products"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Search products"
            />
          </InputGroup>
        </form>

        <nav className="hidden items-center gap-6 text-sm lg:flex">
          <Link
            href="/membership"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Membership
          </Link>
          <Show when="signed-in">
            <Link
              href="/orders"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Orders
            </Link>
          </Show>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="Search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "md:hidden",
            )}
          >
            <SearchIcon className="size-5" />
          </Link>
          <Show when="signed-in">
            <Link
              href="/favourites"
              aria-label="Open favourites"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <Heart className="size-5" />
            </Link>
          </Show>
          <Link
            href="/cart"
            aria-label="Open cart"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative",
            )}
          >
            <ShoppingCart className="size-5" />
            {showBadge ? (
              <Badge
                variant="default"
                className="absolute -right-1 -top-1 min-w-5 justify-center rounded-full px-1.5 py-0 text-[10px] leading-none"
              >
                {itemCount}
              </Badge>
            ) : null}
          </Link>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm">Sign up</Button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
