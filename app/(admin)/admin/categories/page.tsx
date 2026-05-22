import CategoriesTable from "@/components/admin/CategoriesTable";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Organise products into categories. Sort order controls storefront
          placement.
        </p>
      </header>
      <CategoriesTable />
    </div>
  );
}
