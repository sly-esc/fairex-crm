import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/superadmin';
import { ImportResult, ProductInsert } from '@/types/superadmin';
import { parseCsvData } from '@/lib/inventory/csv-parser.server';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }
    const { supabase } = auth;

    // 2. Form Data Validation
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const companyIdStr = formData.get('company_id') as string | null;

    if (!file || !companyIdStr) {
      return NextResponse.json({ error: 'Falta el archivo o el company_id' }, { status: 400 });
    }
    
    const modeRaw = (formData.get('mode') as string | null) || 'onboarding';
    const VALID_MODES = ['onboarding', 'update_inventory'] as const;
    type ImportMode = typeof VALID_MODES[number];
    if (!(VALID_MODES as readonly string[]).includes(modeRaw)) {
      return NextResponse.json({ error: `Modo de importación no válido: '${modeRaw}'. Valores permitidos: onboarding, update_inventory` }, { status: 400 });
    }
    const mode = modeRaw as ImportMode;
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera el tamaño máximo permitido (5 MB)' }, { status: 400 });
    }

    const company_id = parseInt(companyIdStr, 10);
    if (isNaN(company_id) || company_id <= 0) {
      return NextResponse.json({ error: 'El company_id debe ser un número positivo' }, { status: 400 });
    }
    
    const adminClient = createAdminClient();

    // Verify company exists
    const { data: company, error: companyError } = await adminClient
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'La empresa especificada no existe' }, { status: 400 });
    }

    // 3. Parse CSV with helper
    const { success, result, parsedProducts, errorResponse } = await parseCsvData(file, company_id);

    if (errorResponse) {
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }

    if (!success) {
      return NextResponse.json({ success: false, data: result }, { status: 400 });
    }

    // 6. Execute Upsert
    const { data: upsertData, error: upsertError } = await adminClient
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

    // Mark onboarding as completed (only when mode is 'onboarding')
    if (mode === 'onboarding') {
      await adminClient
        .from('companies')
        .update({ 
          onboarding_status: 'completed',
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', company_id);
    }

    result.importedCount = upsertData?.length || 0;

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Error importing CSV:', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
