"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type FavoriteButtonProps = {
  productId: Id<"products">;
};

export default function FavoriteButton({ productId }: FavoriteButtonProps) {
  const { isSignedIn } = useAuth();
  const isFavorited = useQuery(
    api.favorites.isFavorited,
    isSignedIn ? { productId } : "skip",
  );
  const toggleFavorite = useMutation(api.favorites.toggle);
  const [pending, setPending] = useState(false);

  const active = isSignedIn === true && isFavorited === true;

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      aria-pressed={active}
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      disabled={pending}
      onClick={async () => {
        if (!isSignedIn) {
          toast.message("Sign in to save favourites");
          return;
        }
        setPending(true);
        try {
          await toggleFavorite({ productId });
        } catch (err) {
          console.error(err);
          toast.error("Could not update favourites");
        } finally {
          setPending(false);
        }
      }}
    >
      <Heart
        className={cn("size-4", active ? "fill-current text-red-500" : "")}
      />
      {active ? "Saved" : "Save"}
    </Button>
  );
}
