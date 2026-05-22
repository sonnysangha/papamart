"use client";

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { slugify } from "@/components/admin/format";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(80),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, dashes"),
  sortOrder: z
    .number({ message: "Enter a sort order" })
    .int("Sort order must be a whole number"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export type CategoryFormCategory = {
  _id: Id<"categories">;
  name: string;
  slug: string;
  sortOrder: number;
};

export default function CategoryForm({
  category,
  onSuccess,
  onCancel,
}: {
  category?: CategoryFormCategory;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const createCategory = useMutation(api.admin.categories.create);
  const updateCategory = useMutation(api.admin.categories.update);
  const isEdit = category !== undefined;

  const defaultValues = useMemo<CategoryFormValues>(
    () => ({
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      sortOrder: category?.sortOrder ?? 0,
    }),
    [category],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const watchedName = watch("name");
  const slugTouchedRef = useRef(isEdit);
  useEffect(() => {
    if (slugTouchedRef.current) return;
    if (typeof watchedName !== "string") return;
    setValue("slug", slugify(watchedName), {
      shouldValidate: false,
      shouldDirty: true,
    });
  }, [watchedName, setValue]);

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (isEdit && category) {
        await updateCategory({
          categoryId: category._id,
          name: values.name,
          slug: values.slug,
          sortOrder: values.sortOrder,
        });
        toast.success("Category updated");
      } else {
        await createCategory({
          name: values.name,
          slug: values.slug,
          sortOrder: values.sortOrder,
        });
        toast.success("Category created");
      }
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save category";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            placeholder="Fresh produce"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
          <FieldError
            errors={errors.name ? [{ message: errors.name.message }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="category-slug">Slug</FieldLabel>
          <Input
            id="category-slug"
            placeholder="fresh-produce"
            aria-invalid={errors.slug ? true : undefined}
            {...register("slug", {
              onChange: () => {
                slugTouchedRef.current = true;
              },
            })}
          />
          <FieldDescription>
            Used in URLs. Auto-generated from the name until you edit it.
          </FieldDescription>
          <FieldError
            errors={errors.slug ? [{ message: errors.slug.message }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="category-sortOrder">Sort order</FieldLabel>
          <Input
            id="category-sortOrder"
            type="number"
            inputMode="numeric"
            step="1"
            aria-invalid={errors.sortOrder ? true : undefined}
            {...register("sortOrder", { valueAsNumber: true })}
          />
          <FieldDescription>
            Lower numbers appear first in the storefront.
          </FieldDescription>
          <FieldError
            errors={
              errors.sortOrder
                ? [{ message: errors.sortOrder.message }]
                : undefined
            }
          />
        </Field>
      </FieldGroup>

      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create category"}
        </Button>
      </div>
    </form>
  );
}
