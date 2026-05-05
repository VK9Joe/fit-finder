import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wholesale Fit Finder | K9 Apparel Retailer Portal',
  description: 'Authorized retailer sizing tool for K9 Apparel wholesale partners.',
};

export default function WholesaleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
