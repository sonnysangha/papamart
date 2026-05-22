type PriceProps = {
  cents: number;
  currency: string;
  className?: string;
};

export default function Price({ cents, currency, className }: PriceProps) {
  const formatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  return (
    <span className={className} suppressHydrationWarning>
      {formatter.format(cents / 100)}
    </span>
  );
}
