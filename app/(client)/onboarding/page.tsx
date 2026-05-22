import AddressForm from "@/components/client/AddressForm";

type PageProps = {
  searchParams: Promise<{ next?: string }>;
};

function isSafeNext(value: string | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

export default async function OnboardingPage({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const nextPath = isSafeNext(next);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Add a shipping address
        </h1>
        <p className="text-sm text-muted-foreground">
          We use this address for every order. You can update it any time from
          your account.
        </p>
      </header>
      <AddressForm nextPath={nextPath} />
    </div>
  );
}
