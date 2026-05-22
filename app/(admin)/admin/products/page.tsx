import ProductsTable from "@/components/admin/ProductsTable";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground">
          Manage your catalog — create, edit, and remove products.
        </p>
      </header>
      <ProductsTable />
    </div>
  );
}
