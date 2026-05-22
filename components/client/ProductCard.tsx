import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Price from "@/components/client/Price";

type ProductCardProps = {
  name: string;
  slug: string;
  priceCents: number;
  currency: string;
  unit: string;
  stock: number;
  imageUrl: string | null;
};

export default function ProductCard({
  name,
  slug,
  priceCents,
  currency,
  unit,
  stock,
  imageUrl,
}: ProductCardProps) {
  const outOfStock = stock <= 0;
  return (
    <Link
      href={`/products/${slug}`}
      className="group block focus-visible:outline-none"
    >
      <Card className="h-full overflow-hidden p-0 transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
              {name.charAt(0)}
            </div>
          )}
          {outOfStock ? (
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 bg-background/80 backdrop-blur"
            >
              Out of stock
            </Badge>
          ) : null}
        </div>
        <CardContent className="space-y-1 p-4">
          <h3 className="text-sm font-medium leading-snug">{name}</h3>
          <p className="text-xs text-muted-foreground">{unit}</p>
          <p className="pt-1 text-base font-semibold">
            <Price cents={priceCents} currency={currency} />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
