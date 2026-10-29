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

export type DashboardMetrics = {
  totalProducts: number;
  totalUnits: number;
  stockValue: number;
  lowStockCount: number;
  lowStockProducts: Product[];
};

export type CacheStatus = 'HIT' | 'MISS' | 'UNAVAILABLE';

export type CacheObservation = {
  status: CacheStatus;
  responseMs: number;
  key: string;
  queriedAt: string;
  ttlSeconds: number | null;
};
