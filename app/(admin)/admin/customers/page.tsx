import CustomersTable from "@/components/admin/CustomersTable";

export const dynamic = "force-dynamic";

export default function AdminCustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          Everyone who has signed in to the storefront.
        </p>
      </header>
      <CustomersTable />
    </div>
  );
}
