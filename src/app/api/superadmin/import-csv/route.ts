import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ImportResult, ProductInsert } from '@/types/superadmin';
import Papa from 'papaparse';

// Helper to normalize headers
function normalizeHeader(header: string): string {
  const lower = header.toLowerCase().trim();
  if (['nombre', 'name'].includes(lower)) return 'name';
  if (['descripcion', 'description'].includes(lower)) return 'description';
  if (['precio', 'price'].includes(lower)) return 'price';
  if (['costo', 'precio_costo', 'cost_price'].includes(lower)) return 'cost_price';
  if (['stock_minimo', 'min_stock'].includes(lower)) return 'min_stock';
  if (['unidad', 'unit'].includes(lower)) return 'unit';
  if (['categoria', 'category'].includes(lower)) return 'category';
  if (['imagen_url', 'image_url'].includes(lower)) return 'image_url';
  return lower;
}

// Helper to parse numbers properly, handling "$1,200.50"
function parseNumeric(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  const str = String(val).replace(/[^0-9.-]+/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify Super Admin (Server-side)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('auth_user_id', user.id)
      .single();

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'No tienes permisos de Super Admin' }, { status: 403 });
    }

    // 2. Form Data Validation
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const companyIdStr = formData.get('company_id') as string | null;

    if (!file || !companyIdStr) {
      return NextResponse.json({ error: 'Falta el archivo o el company_id' }, { status: 400 });
    }

    const company_id = parseInt(companyIdStr, 10);
    if (isNaN(company_id) || company_id <= 0) {
      return NextResponse.json({ error: 'El company_id debe ser un número positivo' }, { status: 400 });
    }

    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'La empresa especificada no existe' }, { status: 400 });
    }

    // 3. Parse CSV with PapaParse
    const text = await file.text();
    
    const parseResult = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normalizeHeader
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json({ 
        error: 'Error al parsear el CSV', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const rows = parseResult.data as Record<string, any>[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'El archivo CSV está vacío o no tiene datos' }, { status: 400 });
    }

    const result: ImportResult & { importedCount?: number } = {
      valid: true,
      totalRows: rows.length,
      validRows: 0,
      errors: []
    };

    const parsedProducts: ProductInsert[] = [];
    const skuSet = new Set<string>();
    let hasCriticalError = false;

    // 4. Strict Validation per row
    rows.forEach((row, index) => {
      const rowIndex = index + 2; // +1 for 0-index, +1 for header row
      
      const sku = row.sku?.toString().trim();
      const name = row.name?.toString().trim();

      if (!sku) {
        result.errors.push({ row: rowIndex, error: 'SKU es obligatorio' });
        hasCriticalError = true;
      }

      if (!name) {
        result.errors.push({ row: rowIndex, error: 'Nombre es obligatorio' });
        hasCriticalError = true;
      }

      if (sku && skuSet.has(sku)) {
        result.errors.push({ row: rowIndex, error: `SKU duplicado en el CSV: ${sku}` });
        hasCriticalError = true;
      }
      if (sku) skuSet.add(sku);

      const price = parseNumeric(row.price);
      if (price !== null && price < 0) {
        result.errors.push({ row: rowIndex, error: `Precio no puede ser negativo (${row.price})` });
        hasCriticalError = true;
      }

      const cost_price = parseNumeric(row.cost_price);
      if (cost_price !== null && cost_price < 0) {
        result.errors.push({ row: rowIndex, error: `Costo no puede ser negativo (${row.cost_price})` });
        hasCriticalError = true;
      }

      // Default stock/min_stock logic
      const rawStock = parseNumeric(row.stock);
      const stock = rawStock !== null && rawStock >= 0 ? Math.floor(rawStock) : 0;
      if (rawStock !== null && rawStock < 0) {
          result.errors.push({ row: rowIndex, error: `Stock no puede ser negativo (${row.stock})` });
          hasCriticalError = true;
      }
      
      const rawMinStock = parseNumeric(row.min_stock);
      const min_stock = rawMinStock !== null && rawMinStock >= 0 ? Math.floor(rawMinStock) : 0;
      if (rawMinStock !== null && rawMinStock < 0) {
          result.errors.push({ row: rowIndex, error: `Stock mínimo no puede ser negativo (${row.min_stock})` });
          hasCriticalError = true;
      }

      if (!hasCriticalError) {
        result.validRows++;
        parsedProducts.push({
          company_id,
          sku: sku || '',
          name: name || '',
          description: row.description?.toString().trim() || null,
          price,
          cost_price,
          stock,
          min_stock,
          unit: row.unit?.toString().trim() || null,
          category: row.category?.toString().trim() || null,
          image_url: row.image_url?.toString().trim() || null,
          is_active: true,
          source: 'csv',
          metadata: {}
        });
      }
    });

    // 5. If ANY error, abort and do not insert
    if (hasCriticalError || result.errors.length > 0) {
      result.valid = false;
      return NextResponse.json({ success: false, data: result }, { status: 400 });
    }

    // 6. Execute Upsert
    const { data: upsertData, error: upsertError } = await supabase
      .from('products')
      .upsert(parsedProducts, { 
        onConflict: 'company_id,sku',
        ignoreDuplicates: false
      })
      .select('id');

    if (upsertError) {
      console.error('Database Upsert Error:', upsertError);
      return NextResponse.json({ error: `Error en la base de datos: ${upsertError.message}` }, { status: 500 });
    }

    // Mark onboarding as completed 
    await supabase
      .from('companies')
      .update({ 
        onboarding_status: 'completed',
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', company_id);

    result.importedCount = upsertData?.length || 0;

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
