import type { Metadata } from 'next';
import '@fontsource-variable/instrument-sans';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockFlow | Gestão de estoque',
  description: 'Organize produtos, acompanhe quantidades e cuide do seu estoque em um só lugar.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
