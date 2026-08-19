"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/lib/superadmin";
import { productInputSchema, ProductInput, PaginatedProducts, GetProductsParams, ProductRow } from "@/types/products";

export async function getProductsAdmin(companyId: string | number, params: GetProductsParams = {}): Promise<{ success: boolean; data?: PaginatedProducts; error?: string }> {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();

    const parsedCompanyId = Number(companyId);
    if (!Number.isSafeInteger(parsedCompanyId) || parsedCompanyId <= 0) {
      return { success: false, error: "ID de empresa inválido" };
    }

    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(100, Math.max(1, params.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let query = adminClient
      .from("products")
      .select("id, sku, name, description, price, cost_price, stock, min_stock, unit, category, image_url, is_active, created_at, updated_at", { count: "exact" })
      .eq("company_id", parsedCompanyId);

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

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[getProductsAdmin] Error fetching products:", error);
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
    console.error("[getProductsAdmin] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function createProductAdmin(companyId: string | number, input: ProductInput): Promise<{ success: boolean; data?: ProductRow; error?: string }> {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();

    const parsedCompanyId = Number(companyId);
    if (!Number.isSafeInteger(parsedCompanyId) || parsedCompanyId <= 0) {
      return { success: false, error: "ID de empresa inválido" };
    }

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Datos de producto inválidos" };
    }

    const { data, error } = await adminClient
      .from("products")
      .insert({
        company_id: parsedCompanyId,
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
      console.error("[createProductAdmin] Error:", error);
      return { success: false, error: "Error al crear el producto" };
    }

    return { success: true, data: data as ProductRow };
  } catch (error: any) {
    console.error("[createProductAdmin] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function updateProductAdmin(companyId: string | number, id: string, input: ProductInput): Promise<{ success: boolean; data?: ProductRow; error?: string }> {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();

    const parsedCompanyId = Number(companyId);
    if (!Number.isSafeInteger(parsedCompanyId) || parsedCompanyId <= 0) {
      return { success: false, error: "ID de empresa inválido" };
    }

    const parsed = productInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: "Datos de producto inválidos" };
    }

    // Se omiten source, external_id y metadata para conservarlos intactos en BD
    const { data, error } = await adminClient
      .from("products")
      .update({
        ...parsed.data,
        image_url: parsed.data.image_url === "" ? null : parsed.data.image_url,
      })
      .eq("id", id)
      .eq("company_id", parsedCompanyId)
      .select("id, sku, name, description, price, cost_price, stock, min_stock, unit, category, image_url, is_active, created_at, updated_at")
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "Ya existe un producto con este SKU" };
      }
      console.error("[updateProductAdmin] Error:", error);
      return { success: false, error: "Error al actualizar el producto" };
    }

    return { success: true, data: data as ProductRow };
  } catch (error: any) {
    console.error("[updateProductAdmin] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}

export async function toggleProductStatusAdmin(companyId: string | number, id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    await requireSuperAdmin();
    const adminClient = createAdminClient();

    const parsedCompanyId = Number(companyId);
    if (!Number.isSafeInteger(parsedCompanyId) || parsedCompanyId <= 0) {
      return { success: false, error: "ID de empresa inválido" };
    }

    const { error } = await adminClient
      .from("products")
      .update({ is_active: isActive })
      .eq("id", id)
      .eq("company_id", parsedCompanyId);

    if (error) {
      console.error("[toggleProductStatusAdmin] Error:", error);
      return { success: false, error: "Error al cambiar el estado del producto" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[toggleProductStatusAdmin] Exception:", error);
    return { success: false, error: error.message || "Error inesperado" };
  }
}
