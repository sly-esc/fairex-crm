"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUserCompanyId } from "@/lib/services/queries";
import { productInputSchema, ProductInput, PaginatedProducts, GetProductsParams, ProductRow } from "@/types/products";

export async function getProducts(params: GetProductsParams = {}): Promise<{ success: boolean; data?: PaginatedProducts; error?: string }> {
  try {
    const supabase = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("products")
      .select("id, sku, name, description, price, cost_price, stock, min_stock, unit, category, image_url, is_active, created_at, updated_at", { count: "exact" })
      .eq("company_id", companyId);

    if (params.search) {
      // Búsqueda sanitizada para evitar PostgREST injection
      const safeSearch = params.search
        .replace(/[,()"%*]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (safeSearch) {
        query = query.or(`name.ilike.%${safeSearch}%,sku.ilike.%${safeSearch}%`);
      }
    }

    if (params.category) {
      query = query.eq("category", params.category);
    }

    if (params.isActive !== undefined) {
      query = query.eq("is_active", params.isActive);
    }

    // Nota: El filtro de "stock bajo" (stock <= min_stock) requiere una vista, función RPC o campo calculado 
    // a nivel base de datos en Supabase. Dado que no existe actualmente en el schema, se omitió de esta 
    // fase para evitar cargar toda la tabla en memoria.

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[getProducts] Error fetching products:", error);
      return { success: false, error: "Error al cargar los productos" };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    return {
      success: true,
      data: {
        items: (data || []) as ProductRow[],
        total,
        page,
        pageSize,
        totalPages,
      }
    };
  } catch (error: any) {
    console.error("[getProducts] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function createProduct(input: ProductInput): Promise<{ success: boolean; data?: ProductRow; error?: string }> {
  try {
    const supabase = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Datos de producto inválidos" };
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        company_id: companyId,
        source: 'manual',
        ...parsed.data,
        image_url: parsed.data.image_url === "" ? null : parsed.data.image_url,
      })
      .select("id, sku, name, description, price, cost_price, stock, min_stock, unit, category, image_url, is_active, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "Ya existe un producto con este SKU" };
      }
      console.error("[createProduct] Error:", error);
      return { success: false, error: "Error al crear el producto" };
    }

    return { success: true, data: data as ProductRow };
  } catch (error: any) {
    console.error("[createProduct] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function updateProduct(id: string, input: ProductInput): Promise<{ success: boolean; data?: ProductRow; error?: string }> {
  try {
    const supabase = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Datos de producto inválidos" };
    }

    // MUY IMPORTANTE: Se omiten intencionalmente source, external_id y metadata.
    // PostgreSQL mantendrá los valores existentes al no incluirse en este UPDATE.
    const { data, error } = await supabase
      .from("products")
      .update({
        ...parsed.data,
        image_url: parsed.data.image_url === "" ? null : parsed.data.image_url,
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select("id, sku, name, description, price, cost_price, stock, min_stock, unit, category, image_url, is_active, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "Ya existe un producto con este SKU" };
      }
      console.error("[updateProduct] Error:", error);
      return { success: false, error: "Error al actualizar el producto" };
    }

    return { success: true, data: data as ProductRow };
  } catch (error: any) {
    console.error("[updateProduct] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function toggleProductStatus(id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const companyId = await requireUserCompanyId(supabase);

    const { error } = await supabase
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("company_id", companyId);

    if (error) {
      console.error("[toggleProductStatus] Error:", error);
      return { success: false, error: "Error al cambiar el estado del producto" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[toggleProductStatus] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}
