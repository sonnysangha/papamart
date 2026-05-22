"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { slugify } from "@/components/admin/format";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, dashes"),
  description: z.string().max(2000),
  price: z
    .number({ message: "Enter a price" })
    .min(0, "Price cannot be negative"),
  categoryId: z.string().min(1, "Pick a category"),
  stock: z
    .number({ message: "Enter stock" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  unit: z.string().min(1, "Unit is required").max(40),
  isActive: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export type ProductFormProduct = {
  _id: Id<"products">;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  categoryId: Id<"categories">;
  stock: number;
  unit: string;
  isActive: boolean;
  imageUrl: string | null;
  imageStorageId?: Id<"_storage">;
};

export default function ProductForm({
  product,
  onSuccess,
  onCancel,
}: {
  product?: ProductFormProduct;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const categories = useQuery(api.admin.categories.list, {});
  const createProduct = useMutation(api.admin.products.create);
  const updateProduct = useMutation(api.admin.products.update);
  const generateUploadUrl = useMutation(api.admin.products.generateUploadUrl);

  const isEdit = product !== undefined;

  const defaultValues = useMemo<ProductFormValues>(
    () => ({
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product ? product.priceCents / 100 : 0,
      categoryId: product?.categoryId ?? "",
      stock: product?.stock ?? 0,
      unit: product?.unit ?? "each",
      isActive: product?.isActive ?? true,
    }),
    [product],
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
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

  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.imageUrl ?? null,
  );
  const [imageStorageId, setImageStorageId] = useState<
    Id<"_storage"> | null | undefined
  >(product?.imageStorageId ?? undefined);
  const [uploading, setUploading] = useState(false);

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const priceCents = Math.round(values.price * 100);
      if (isEdit && product) {
        await updateProduct({
          productId: product._id,
          name: values.name,
          slug: values.slug,
          description: values.description,
          priceCents,
          categoryId: values.categoryId as Id<"categories">,
          stock: values.stock,
          unit: values.unit,
          isActive: values.isActive,
          imageStorageId:
            imageStorageId === undefined
              ? undefined
              : (imageStorageId as Id<"_storage"> | null),
        });
        toast.success("Product updated");
      } else {
        await createProduct({
          name: values.name,
          slug: values.slug,
          description: values.description,
          priceCents,
          categoryId: values.categoryId as Id<"categories">,
          stock: values.stock,
          unit: values.unit,
          isActive: values.isActive,
          imageStorageId: imageStorageId ?? undefined,
        });
        toast.success("Product created");
      }
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save product";
      toast.error(message);
    }
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok) {
        throw new Error(`Upload failed (${response.status})`);
      }
      const json = (await response.json()) as { storageId: Id<"_storage"> };
      setImageStorageId(json.storageId);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(typeof reader.result === "string" ? reader.result : null);
      };
      reader.readAsDataURL(file);
      toast.success("Image uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImageStorageId(null);
    setImagePreview(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="product-name">Name</FieldLabel>
          <Input
            id="product-name"
            placeholder="Organic bananas"
            aria-invalid={errors.name ? true : undefined}
            {...register("name")}
          />
          <FieldError
            errors={errors.name ? [{ message: errors.name.message }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="product-slug">Slug</FieldLabel>
          <Input
            id="product-slug"
            placeholder="organic-bananas"
            aria-invalid={errors.slug ? true : undefined}
            {...register("slug", {
              onChange: () => {
                slugTouchedRef.current = true;
              },
            })}
          />
          <FieldDescription>
            Auto-generated from the name until you edit it.
          </FieldDescription>
          <FieldError
            errors={errors.slug ? [{ message: errors.slug.message }] : undefined}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="product-description">Description</FieldLabel>
          <Textarea
            id="product-description"
            placeholder="Sweet, ripe and Fairtrade-certified."
            rows={4}
            {...register("description")}
          />
          <FieldError
            errors={
              errors.description
                ? [{ message: errors.description.message }]
                : undefined
            }
          />
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="product-price">Price</FieldLabel>
            <Input
              id="product-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              aria-invalid={errors.price ? true : undefined}
              {...register("price", { valueAsNumber: true })}
            />
            <FieldError
              errors={
                errors.price ? [{ message: errors.price.message }] : undefined
              }
            />
          </FieldContent>
          <FieldContent>
            <FieldLabel htmlFor="product-stock">Stock</FieldLabel>
            <Input
              id="product-stock"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              aria-invalid={errors.stock ? true : undefined}
              {...register("stock", { valueAsNumber: true })}
            />
            <FieldError
              errors={
                errors.stock ? [{ message: errors.stock.message }] : undefined
              }
            />
          </FieldContent>
          <FieldContent>
            <FieldLabel htmlFor="product-unit">Unit</FieldLabel>
            <Input
              id="product-unit"
              placeholder="each, kg, 500g"
              aria-invalid={errors.unit ? true : undefined}
              {...register("unit")}
            />
            <FieldError
              errors={
                errors.unit ? [{ message: errors.unit.message }] : undefined
              }
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Category</FieldLabel>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={errors.categoryId ? true : undefined}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories === undefined ? (
                    <SelectItem value="__loading" disabled>
                      Loading…
                    </SelectItem>
                  ) : categories.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No categories yet
                    </SelectItem>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError
            errors={
              errors.categoryId
                ? [{ message: errors.categoryId.message }]
                : undefined
            }
          />
        </Field>

        <Field>
          <FieldLabel>Status</FieldLabel>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Select
                value={field.value ? "active" : "inactive"}
                onValueChange={(v) => field.onChange(v === "active")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active — visible to customers</SelectItem>
                  <SelectItem value="inactive">Inactive — hidden</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field>
          <FieldLabel>Image</FieldLabel>
          <div className="flex items-start gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground">No image</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label
                className="inline-flex h-8 w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
                aria-busy={uploading}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span>{uploading ? "Uploading…" : "Choose image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </label>
              {(imagePreview || imageStorageId) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearImage}
                >
                  <X />
                  Remove image
                </Button>
              )}
              <FieldDescription>
                PNG or JPG, square works best.
              </FieldDescription>
            </div>
          </div>
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
          {isEdit ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
