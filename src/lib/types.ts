export type Product = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit_price: number;
  created_at: string;
  updated_at: string;
};

export type ProductInput = Pick<Product, 'name' | 'category' | 'quantity' | 'unit_price'>;
export type ProductUpdateInput = Pick<Product, 'name' | 'category' | 'unit_price'>;

export type StockMovement = {
  id: string;
  product_id: string | null;
  product_name: string;
  movement_type: 'in' | 'out';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reason: string;
  created_at: string;
};

export type StockMovementInput = {
  product_id: string;
  movement_type: StockMovement['movement_type'];
  quantity: number;
  reason: string;
};

export type DashboardMetrics = {
  totalProducts: number;
  totalUnits: number;
  stockValue: number;
  totalCategories: number;
  recentProducts: Product[];
};

export type CacheStatus = 'HIT' | 'MISS' | 'UNAVAILABLE';

export type CacheObservation = {
  status: CacheStatus;
  responseMs: number;
  key: string;
  queriedAt: string;
  ttlSeconds: number | null;
};
