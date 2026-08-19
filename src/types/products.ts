import { z } from "zod";

// Zod schemas para validación
export const productInputSchema = z.object({
  sku: z.string().min(1, "El SKU es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().nullable().optional(),
  price: z.number().nonnegative("El precio no puede ser negativo").nullable().optional(),
  cost_price: z.number().nonnegative("El costo no puede ser negativo").nullable().optional(),
  stock: z.number().int("El stock debe ser un entero").nonnegative("El stock no puede ser negativo").default(0),
  min_stock: z.number().int("El stock mínimo debe ser entero").nonnegative("El stock mínimo no puede ser negativo").default(0),
  unit: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  image_url: z.string().url("URL inválida").nullable().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productInputSchema>;

// Tipo para la fila devuelta por la base de datos a la UI (omitimos metadata, source, external_id para la UI)
// Estos campos existen en BD pero la UI de crud visual no los administra.
export interface ProductRow {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  price: number | null;
  cost_price: number | null;
  stock: number;
  min_stock: number;
  unit: string | null;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Interfaz para el estado de paginación
export interface PaginatedProducts {
  items: ProductRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Parámetros de consulta
export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
}
