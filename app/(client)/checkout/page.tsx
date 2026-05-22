import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import CheckoutForm from "@/components/client/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();
  if (!session.userId) {
    redirect("/sign-in?next=/checkout");
  }

  const token = await session.getToken({ template: "convex" });
  const currentUser = await fetchQuery(
    api.users.currentUser,
    {},
    token ? { token } : undefined,
  );

  if (!currentUser || !currentUser.address) {
    redirect("/onboarding?next=/checkout");
  }

  const { address } = currentUser;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-sm text-muted-foreground">
          Confirm your order and pay securely with Stripe.
        </p>
      </header>

      <section className="mb-6 rounded-lg border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Shipping address
        </h2>
        <address className="mt-2 not-italic text-sm leading-relaxed">
          {address.fullName}
          <br />
          {address.line1}
          {address.line2 ? (
            <>
              <br />
              {address.line2}
            </>
          ) : null}
          <br />
          {address.city}, {address.region} {address.postalCode}
          <br />
          {address.country}
          {address.phone ? (
            <>
              <br />
              <span className="text-muted-foreground">{address.phone}</span>
            </>
          ) : null}
        </address>
      </section>

      <CheckoutForm />
    </div>
  );
}
