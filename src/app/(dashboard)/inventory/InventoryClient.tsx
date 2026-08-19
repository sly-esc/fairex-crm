"use client";

import { useAppStore } from "@/lib/store";
import ProductsManager from "@/components/domain/ProductsManager";
import InventoryCsvImporter from "@/components/domain/InventoryCsvImporter";
import { getProducts, createProduct, updateProduct, toggleProductStatus } from "@/actions/dashboard/products";

export default function InventoryClient() {
  const { _hasHydrated } = useAppStore();

  if (!_hasHydrated) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <ProductsManager
        fetchProducts={getProducts}
        createProduct={createProduct}
        updateProduct={updateProduct}
        toggleProductStatus={toggleProductStatus}
        csvImporterNode={
          <InventoryCsvImporter 
            uploadUrl="/api/inventory/import-csv" 
            onSuccess={() => {
              // Reload page or re-trigger fetchProducts
              // Since we don't have a direct ref to ProductsManager's internal refresh, 
              // we can simply do window.location.reload() for now as it's simple and guarantees consistency
              window.location.reload();
            }}
          />
        }
      />
    </div>
  );
}
