import { Metadata } from 'next';
import InventoryClient from './InventoryClient';

export const metadata: Metadata = {
  title: 'Inventario | FAIREX Business OS',
  description: 'Gestiona el catálogo de productos y existencias.',
};

export default function InventoryPage() {
  return <InventoryClient />;
}
