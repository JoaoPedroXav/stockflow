import type { DashboardMetrics, Product } from '@/lib/types';

export function calculateDashboard(products: Product[]): DashboardMetrics {
  return {
    totalProducts: products.length,
    totalUnits: products.reduce((total, product) => total + product.quantity, 0),
    stockValue: products.reduce((total, product) => total + product.quantity * product.unit_price, 0),
    totalCategories: new Set(products.map((product) => product.category)).size,
    recentProducts: products.slice(0, 6),
  };
}
