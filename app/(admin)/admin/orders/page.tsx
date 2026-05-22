import OrdersTable from "@/components/admin/OrdersTable";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Track and fulfil customer orders.
        </p>
      </header>
      <OrdersTable />
    </div>
  );
}
