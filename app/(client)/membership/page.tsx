import { PricingTable } from "@clerk/nextjs";
import { Sparkles, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function MembershipPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <header className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-5 text-primary" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Papamart Membership
        </h1>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          One subscription, free shipping on every order, forever. Cancel any
          time.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="space-y-2 p-5">
            <Truck className="size-5 text-primary" />
            <h3 className="text-base font-semibold">Free shipping</h3>
            <p className="text-sm text-muted-foreground">
              Shipping is on us for every order, no minimum spend.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <Sparkles className="size-5 text-primary" />
            <h3 className="text-base font-semibold">Member perks</h3>
            <p className="text-sm text-muted-foreground">
              Early access to seasonal drops and limited specials.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2 p-5">
            <Truck className="size-5 text-primary" />
            <h3 className="text-base font-semibold">Cancel any time</h3>
            <p className="text-sm text-muted-foreground">
              Manage your subscription from your account at any moment.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border bg-card p-4 sm:p-6">
        <PricingTable />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Free-shipping membership unlocks the{" "}
        <span className="font-medium">free_shipping</span> feature. Plans are
        managed in Clerk Billing.
      </p>
    </div>
  );
}
