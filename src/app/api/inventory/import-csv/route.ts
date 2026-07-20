import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCsvData } from '@/lib/inventory/csv-parser.server';

export async function POST(req: NextRequest) {
  try {
    // 1. Create session client & get secure user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Fetch company_id securely from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile || !profile.company_id) {
      return NextResponse.json({ error: 'No tienes una empresa asociada (company_id nulo o inválido)' }, { status: 403 });
    }

    const company_id = profile.company_id;

    // 3. Form Data Validation
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Falta el archivo' }, { status: 400 });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'El archivo supera el tamaño máximo permitido (5 MB)' }, { status: 400 });
    }

    // 4. Parse CSV with shared helper
    const { success, result, parsedProducts, errorResponse } = await parseCsvData(file, company_id);

    if (errorResponse) {
      return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.status });
    }

    if (!success) {
      return NextResponse.json({ success: false, data: result }, { status: 400 });
    }

    // 5. Execute Upsert using adminClient for bypass (only for the resolved company_id)
    const adminClient = createAdminClient();
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

    // Success response for the client (matches superadmin format)
    return NextResponse.json({ 
      success: true, 
      data: {
        ...result,
        importedCount: upsertData?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Unexpected error in client CSV import:', error);
    return NextResponse.json({ error: 'Ocurrió un error inesperado en el servidor.' }, { status: 500 });
  }
}
