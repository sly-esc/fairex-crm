import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeSearchQuery } from '@/lib/inventory/search-sanitize';

// -------------------------------------------------------------------------------------
// SEGURIDAD: Validación del Secret compartido con n8n
// -------------------------------------------------------------------------------------
function validateSecret(req: NextRequest): boolean {
  const secret = process.env.N8N_CONTEXT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    console.warn('[n8n/inventory-search] ADVERTENCIA: N8N_CONTEXT_SECRET no configurado (modo desarrollo).');
    return true;
  }
  return req.headers.get('x-n8n-secret') === secret;
}

// -------------------------------------------------------------------------------------
// FUNCIÓN PURA: Scoring de relevancia
// -------------------------------------------------------------------------------------
function calculateRelevance(item: any, safeQuery: string): number {
  const query = safeQuery.toLowerCase();
  const sku = (item.sku || '').toLowerCase();
  const name = (item.name || '').toLowerCase();
  const category = (item.category || '').toLowerCase();
  const description = (item.description || '').toLowerCase();

  let score = 0;

  if (sku === query) {
    score = 1000;
  } else if (name === query) {
    score = 900;
  } else if (name.startsWith(query)) {
    score = 700;
  } else if (sku.startsWith(query)) {
    score = 650;
  } else if (sku.includes(query)) {
    score = 600;
  } else if (name.includes(query)) {
    score = 500;
  } else if (category === query) {
    score = 400;
  } else if (category.includes(query)) {
    score = 300;
  } else if (description.includes(query)) {
    score = 100;
  }

  // Desempate por stock
  if (item.stock > 0) {
    score += 1;
  }

  return score;
}

// -------------------------------------------------------------------------------------
// HANDLER PRINCIPAL
// -------------------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  if (!validateSecret(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON payload', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  const { provider, identifier, query } = body;

  if (!provider || !identifier || !query) {
    return NextResponse.json(
      { ok: false, error: 'provider, identifier y query son requeridos', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  if (typeof query !== 'string' || query.length > 200) {
    return NextResponse.json(
      { ok: false, error: 'query debe ser un string de máximo 200 caracteres', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  let normalizedIdentifier = String(identifier).trim();
  if (provider === 'ycloud') {
    normalizedIdentifier = normalizedIdentifier.replace(/\D/g, '');
  }
  if (!normalizedIdentifier) {
    return NextResponse.json(
      { ok: false, error: 'Identifier inválido', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  const safeQuery = sanitizeSearchQuery(query);
  if (!safeQuery) {
    return NextResponse.json(
      { ok: true, query, count: 0, items: [] },
      { status: 200 }
    );
  }

  const supabase = createAdminClient();

  try {
    // 1. Resolver Tenant
    const { data: integration, error: integrationError } = await supabase
      .from('company_integrations')
      .select('company_id')
      .eq('provider', provider)
      .eq('provider_account_id', normalizedIdentifier)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json(
        {
          ok: false,
          error: `No se encontró integración activa para provider='${provider}' identifier='${identifier}'`,
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const { company_id } = integration;

    // 2. Verificar que la empresa esté activa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, estado')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { ok: false, error: 'Empresa no encontrada', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (company.estado !== 'activa') {
      return NextResponse.json(
        { ok: false, error: 'La empresa está inactiva', code: 'COMPANY_INACTIVE' },
        { status: 403 }
      );
    }

    // 3. Consultar productos de ESA empresa
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, sku, name, description, price, stock, unit, category, image_url')
      .eq('company_id', company_id)
      .eq('is_active', true)
      .or(`name.ilike.%${safeQuery}%,sku.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,category.ilike.%${safeQuery}%`)
      .limit(20);

    if (productsError) {
      console.error('[n8n/inventory-search] Error al consultar productos:', productsError.message);
      return NextResponse.json(
        { ok: false, error: 'Error al consultar inventario', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }

    // 4. Scoring y Ordenamiento
    const items = products || [];
    
    const scoredItems = items.map((item) => ({
      ...item,
      score: calculateRelevance(item, safeQuery),
      availability: item.stock > 0 ? 'available' : 'out_of_stock'
    }));

    scoredItems.sort((a, b) => b.score - a.score);

    // Tomamos los top 5
    const topItems = scoredItems.slice(0, 5).map((item) => {
      // Eliminar el score de la respuesta final
      const { score, ...rest } = item;
      return rest;
    });

    return NextResponse.json(
      {
        ok: true,
        query,
        count: topItems.length,
        items: topItems
      },
      { status: 200 }
    );

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[n8n/inventory-search] Error interno:', message);
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
