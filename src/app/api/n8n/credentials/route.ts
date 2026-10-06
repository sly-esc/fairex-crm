import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptCredentials, isEncryptedCredentialsEnvelope } from '@/lib/integrations/encryption.server';

// ======================================================================================
// ENDPOINT: GET /api/n8n/credentials
// ======================================================================================
// RESPONSABILIDAD: Exponer de forma segura las credenciales de terceros (YCloud, etc.)
// a n8n, basándose en el identificador (ej. número de teléfono).
// ======================================================================================

function validateSecret(req: NextRequest): boolean {
  const secret = process.env.N8N_CONTEXT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false;
    console.warn('[n8n/credentials] ADVERTENCIA: N8N_CONTEXT_SECRET no configurado (modo desarrollo).');
    return true;
  }
  return req.headers.get('x-n8n-secret') === secret;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Validación de seguridad
  if (!validateSecret(req)) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // 2. Parse de parámetros
  const { searchParams } = new URL(req.url);
  const identifier = searchParams.get('identifier');
  
  if (!identifier) {
    return NextResponse.json(
      { ok: false, error: 'identifier es requerido', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // Normalización estricta (asumimos YCloud/WhatsApp por defecto si es numérico)
  const normalizedIdentifier = String(identifier).replace(/\D/g, '');

  if (!normalizedIdentifier) {
    return NextResponse.json(
      { ok: false, error: 'Identifier inválido', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // 3. Cliente Supabase con service_role
  const supabase = createAdminClient();

  try {
    const { data: integration, error } = await supabase
      .from('company_integrations')
      .select('id, company_id, credentials')
      .eq('provider_account_id', normalizedIdentifier)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error || !integration) {
      return NextResponse.json(
        { ok: false, error: 'No se encontró integración activa para este identificador', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!integration.credentials || !isEncryptedCredentialsEnvelope(integration.credentials)) {
      return NextResponse.json(
        { ok: false, error: 'La integración no tiene credenciales válidas guardadas', code: 'NO_CREDENTIALS' },
        { status: 404 }
      );
    }

    // 4. Desencriptar de forma segura
    const decrypted = decryptCredentials(integration.credentials as Record<string, unknown>);

    return NextResponse.json(
      { ok: true, credentials: decrypted },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[n8n/credentials] Error interno:', message);
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
