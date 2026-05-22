import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

type CategoryCardProps = {
  name: string;
  slug: string;
  imageUrl: string | null;
};

export default function CategoryCard({
  name,
  slug,
  imageUrl,
}: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${slug}`}
      className="group block focus-visible:outline-none"
    >
      <Card className="h-full overflow-hidden p-0 transition-shadow group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
              {name.charAt(0)}
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="text-base font-medium tracking-tight">{name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Shop {name.toLowerCase()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
