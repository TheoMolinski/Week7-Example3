// A list projection: absent or null prices are displayed as a placeholder.
export type Product = {
  readonly id: string;
  readonly name: string;
  readonly pricePence?: number | null;
  readonly description?: string;
};
