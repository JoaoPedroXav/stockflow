import type { DashboardMetrics, Product } from '@/lib/types';

export function calculateDashboard(products: Product[]): DashboardMetrics {
  const lowStockProducts = products.filter((product) => product.quantity <= 5);
  return {
    totalProducts: products.length,
    totalUnits: products.reduce((total, product) => total + product.quantity, 0),
    stockValue: products.reduce((total, product) => total + product.quantity * product.unit_price, 0),
    lowStockCount: lowStockProducts.length,
    lowStockProducts: lowStockProducts.sort((a, b) => a.quantity - b.quantity),
  };
}
