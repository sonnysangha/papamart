"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

const COUNTRIES: ReadonlyArray<{ code: string; name: string }> = [
  { code: "GB", name: "United Kingdom" },
  { code: "IE", name: "Ireland" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
];

const addressFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "State or county is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z
    .string()
    .length(2, "Use a 2-letter ISO country code")
    .regex(/^[A-Z]{2}$/, "Use uppercase letters"),
  phone: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

type AddressFormProps = {
  nextPath: string;
};

export default function AddressForm({ nextPath }: AddressFormProps) {
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser, {});
  const setAddress = useMutation(api.users.setAddress);

  const existing = currentUser?.address;

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      fullName: existing?.fullName ?? "",
      line1: existing?.line1 ?? "",
      line2: existing?.line2 ?? "",
      city: existing?.city ?? "",
      region: existing?.region ?? "",
      postalCode: existing?.postalCode ?? "",
      country: existing?.country ?? "GB",
      phone: existing?.phone ?? "",
    },
    values: existing
      ? {
          fullName: existing.fullName,
          line1: existing.line1,
          line2: existing.line2 ?? "",
          city: existing.city,
          region: existing.region,
          postalCode: existing.postalCode,
          country: existing.country,
          phone: existing.phone ?? "",
        }
      : undefined,
  });

  if (currentUser === undefined) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  async function onSubmit(values: AddressFormValues) {
    try {
      await setAddress({
        address: {
          fullName: values.fullName.trim(),
          line1: values.line1.trim(),
          line2: values.line2?.trim() ? values.line2.trim() : undefined,
          city: values.city.trim(),
          region: values.region.trim(),
          postalCode: values.postalCode.trim(),
          country: values.country.trim().toUpperCase(),
          phone: values.phone?.trim() ? values.phone.trim() : undefined,
        },
      });
      toast.success("Address saved");
      router.push(nextPath);
    } catch (err) {
      console.error(err);
      toast.error("Could not save address");
    }
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldGroup>
        <Field data-invalid={errors.fullName ? true : undefined}>
          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={errors.fullName ? true : undefined}
            {...form.register("fullName")}
          />
          <FieldError errors={[errors.fullName]} />
        </Field>

        <Field data-invalid={errors.line1 ? true : undefined}>
          <FieldLabel htmlFor="line1">Address line 1</FieldLabel>
          <Input
            id="line1"
            autoComplete="address-line1"
            aria-invalid={errors.line1 ? true : undefined}
            {...form.register("line1")}
          />
          <FieldError errors={[errors.line1]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="line2">
            Address line 2 <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="line2"
            autoComplete="address-line2"
            {...form.register("line2")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.city ? true : undefined}>
            <FieldLabel htmlFor="city">City</FieldLabel>
            <Input
              id="city"
              autoComplete="address-level2"
              aria-invalid={errors.city ? true : undefined}
              {...form.register("city")}
            />
            <FieldError errors={[errors.city]} />
          </Field>
          <Field data-invalid={errors.region ? true : undefined}>
            <FieldLabel htmlFor="region">State / County</FieldLabel>
            <Input
              id="region"
              autoComplete="address-level1"
              aria-invalid={errors.region ? true : undefined}
              {...form.register("region")}
            />
            <FieldError errors={[errors.region]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={errors.postalCode ? true : undefined}>
            <FieldLabel htmlFor="postalCode">Postal code</FieldLabel>
            <Input
              id="postalCode"
              autoComplete="postal-code"
              aria-invalid={errors.postalCode ? true : undefined}
              {...form.register("postalCode")}
            />
            <FieldError errors={[errors.postalCode]} />
          </Field>
          <Field data-invalid={errors.country ? true : undefined}>
            <FieldLabel htmlFor="country">Country</FieldLabel>
            <select
              id="country"
              aria-invalid={errors.country ? true : undefined}
              className="flex h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...form.register("country")}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
            <FieldDescription>ISO-3166 alpha-2 code.</FieldDescription>
            <FieldError errors={[errors.country]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="phone">
            Phone <span className="text-muted-foreground">(optional)</span>
          </FieldLabel>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            {...form.register("phone")}
          />
          <FieldDescription>
            Used by the courier on delivery day.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save address"}
      </Button>
    </form>
  );
}
