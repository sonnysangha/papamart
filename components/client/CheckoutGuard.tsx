"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";

type CheckoutGuardProps = {
  children: React.ReactNode;
  nextPath?: string;
};

export default function CheckoutGuard({
  children,
  nextPath = "/checkout",
}: CheckoutGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const currentUser = useQuery(
    api.users.currentUser,
    isLoaded && isSignedIn ? {} : "skip",
  );

  if (!isLoaded || (isSignedIn && currentUser === undefined)) {
    return <Skeleton className="h-9 w-full" />;
  }

  if (!isSignedIn) {
    return <>{children}</>;
  }

  if (!currentUser || !currentUser.address) {
    const onboardingHref = `/onboarding?next=${encodeURIComponent(nextPath)}`;
    return (
      <div className="space-y-3">
        <Alert>
          <AlertTitle>Add a shipping address</AlertTitle>
          <AlertDescription>
            We need a delivery address before you can check out.
          </AlertDescription>
        </Alert>
        <Link
          href={onboardingHref}
          className={cn(buttonVariants(), "w-full")}
        >
          Add address
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
