// A list projection: absent prices are displayed as a placeholder.
export type Product = {
  readonly id: string;
  readonly name: string;
  readonly pricePence?: number;
  readonly description?: string;
};
