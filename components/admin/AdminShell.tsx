"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  products: "Products",
  categories: "Categories",
  orders: "Orders",
  customers: "Customers",
  new: "New",
};

function labelFor(segment: string): string {
  if (segment in SEGMENT_LABELS) {
    return SEGMENT_LABELS[segment];
  }
  // For id-like segments (e.g. order or product ids), render a truncated label.
  if (segment.length > 12) {
    return `${segment.slice(0, 6)}…${segment.slice(-4)}`;
  }
  return segment;
}

type Crumb = { href: string; label: string };

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [];
  let acc = "";
  for (const segment of segments) {
    acc += `/${segment}`;
    crumbs.push({ href: acc, label: labelFor(segment) });
  }
  return crumbs;
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const crumbs = buildCrumbs(pathname);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <span key={crumb.href} className="contents">
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink render={<Link href={crumb.href} />}>
                        {crumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </span>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">{children}</div>
      </div>
    </>
  );
}
