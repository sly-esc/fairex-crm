"use client";

import { useState, useEffect, useTransition } from "react";
import { Search, Plus, UploadCloud, Edit2, Archive, ArchiveRestore, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductRow, ProductInput, PaginatedProducts, GetProductsParams } from "@/types/products";
import ProductForm from "./ProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ProductsManagerProps {
  fetchProducts: (params: GetProductsParams) => Promise<{ success: boolean; data?: PaginatedProducts; error?: string }>;
  createProduct: (data: ProductInput) => Promise<{ success: boolean; data?: ProductRow; error?: string }>;
  updateProduct: (id: string, data: ProductInput) => Promise<{ success: boolean; data?: ProductRow; error?: string }>;
  toggleProductStatus: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  csvImporterNode?: React.ReactNode;
}

export default function ProductsManager({
  fetchProducts,
  createProduct,
  updateProduct,
  toggleProductStatus,
  csvImporterNode,
}: ProductsManagerProps) {
  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filtros
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);

  // Vistas / Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Volver a pag 1 al buscar
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when category or status changes
  useEffect(() => {
    setPage(1);
  }, [category, isActiveFilter]);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts({
        page,
        pageSize: 20,
        search: debouncedSearch,
        category: category || undefined,
        isActive: isActiveFilter,
      });

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Error al cargar los productos");
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      loadData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, category, isActiveFilter]);

  // Handlers de estado y form
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const res = await toggleProductStatus(id, newStatus);
    if (res.success) {
      // Optimistic update
      if (data) {
        setData({
          ...data,
          items: data.items.map(p => p.id === id ? { ...p, is_active: newStatus } : p)
        });
      }
    } else {
      alert(res.error || "Error al cambiar estado");
    }
  };

  const handleFormSubmit = async (input: ProductInput) => {
    let res;
    if (editingProduct) {
      res = await updateProduct(editingProduct.id, input);
    } else {
      res = await createProduct(input);
    }
    
    if (res.success) {
      setIsFormOpen(false);
      setEditingProduct(null);
      loadData(); // Refrescar para tener el sorting y paginación correcta
    }
    return res;
  };

  const closeModals = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
    setIsCsvOpen(false);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { label: "Sin stock", color: "bg-red-500/10 text-red-400 border-red-500/20" };
    if (stock <= minStock) return { label: "Stock bajo", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { label: "Disponible", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
  };

  // Vistas modales
  if (isFormOpen) {
    return (
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-medium text-white">{editingProduct ? "Editar Producto" : "Nuevo Producto"}</h2>
          <Button variant="ghost" onClick={closeModals} className="text-zinc-400 hover:text-white">Volver</Button>
        </div>
        <ProductForm 
          initialData={editingProduct || undefined} 
          onSubmit={handleFormSubmit} 
          onCancel={closeModals}
        />
      </div>
    );
  }

  if (isCsvOpen && csvImporterNode) {
    return (
      <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-medium text-white">Importar / Actualizar por CSV</h2>
          <Button variant="ghost" onClick={closeModals} className="text-zinc-400 hover:text-white">Volver</Button>
        </div>
        <div className="max-w-xl mx-auto py-8">
          {csvImporterNode}
        </div>
      </div>
    );
  }

  // Si no hay productos en absoluto (total 0) y no hay filtros aplicados, mostramos empty state total
  const isCompletelyEmpty = data?.total === 0 && !debouncedSearch && !category && isActiveFilter === undefined;

  return (
    <div className="space-y-6">
      {/* Header y Acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/30 border border-white/5 p-6 rounded-xl">
        <div>
          <h2 className="text-xl font-medium text-white">Inventario</h2>
          <p className="text-sm text-zinc-400 mt-1">Gestiona tus productos, precios y existencias.</p>
        </div>
        <div className="flex gap-2">
          {csvImporterNode && (
            <Button variant="outline" onClick={() => setIsCsvOpen(true)} className="border-white/10 text-zinc-300 hover:text-white">
              <UploadCloud className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {isCompletelyEmpty ? (
        <div className="border-2 border-dashed border-white/10 rounded-xl p-12 text-center bg-black/20">
          <Archive className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aún no tienes productos</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Agrega un producto manualmente o importa tu catálogo mediante CSV para comenzar a gestionar tu inventario.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
            {csvImporterNode && (
              <Button variant="outline" onClick={() => setIsCsvOpen(true)} className="border-white/10 text-zinc-300">
                <UploadCloud className="w-4 h-4 mr-2" />
                Importar CSV
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/30 border border-white/5 rounded-xl flex flex-col min-h-[500px]">
          {/* Filtros */}
          <div className="p-4 border-b border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 rounded-t-xl">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <Input 
                placeholder="Buscar nombre o SKU..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-black/40 border-white/10 text-white"
              />
            </div>
            <Input 
              placeholder="Categoría..." 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-black/40 border-white/10 text-white"
            />
            <select 
              value={isActiveFilter === undefined ? "" : isActiveFilter ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value;
                setIsActiveFilter(val === "" ? undefined : val === "true");
              }}
              className="bg-black/40 border border-white/10 text-zinc-300 text-sm rounded-md px-3 py-2 outline-none focus:border-indigo-500 w-full"
            >
              <option value="">Cualquier estado</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {error && (
            <div className="m-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Tabla */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/20 text-zinc-400 text-xs uppercase font-medium border-b border-white/10">
                <tr>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-6 py-3">Precio</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 relative">
                {(loading || isPending) && (
                  <tr>
                    <td colSpan={7}>
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                )}
                {data?.items.length === 0 && !loading && !isPending && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron productos con estos filtros.
                    </td>
                  </tr>
                )}
                {data?.items.map(product => {
                  const stockStatus = getStockStatus(product.stock, product.min_stock);
                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4 font-mono text-zinc-300 text-xs">{product.sku}</td>
                      <td className="px-6 py-4">
                        <p className="text-zinc-200 font-medium truncate max-w-[200px]" title={product.name}>{product.name}</p>
                        {product.unit && <p className="text-zinc-500 text-xs">Por {product.unit}</p>}
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {product.price !== null ? `$${product.price.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-300 font-medium">{product.stock}</span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">{product.category || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${product.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-400' : 'bg-zinc-500'}`}></span>
                          {product.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingProduct(product); setIsFormOpen(true); }}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            title="Editar producto"
                            aria-label="Editar producto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product.id, product.is_active)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                            title={product.is_active ? "Desactivar producto" : "Activar producto"}
                            aria-label={product.is_active ? "Desactivar producto" : "Activar producto"}
                          >
                            {product.is_active ? <Archive className="w-4 h-4 text-amber-400" /> : <ArchiveRestore className="w-4 h-4 text-emerald-400" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {data && data.totalPages > 1 && (
            <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20 rounded-b-xl">
              <p className="text-sm text-zinc-400">
                Mostrando página <span className="font-medium text-white">{data.page}</span> de <span className="font-medium text-white">{data.totalPages}</span>
                <span className="ml-2 hidden sm:inline">({data.total} productos)</span>
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={data.page === 1 || loading || isPending}
                  className="border-white/10 text-zinc-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={data.page === data.totalPages || loading || isPending}
                  className="border-white/10 text-zinc-300"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
