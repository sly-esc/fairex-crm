'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/superadmin';
import { CompanyIntegration, WizardIntegrationKey } from '@/types/superadmin';
import { encryptCredentials, isEncryptedCredentialsEnvelope } from '@/lib/integrations/encryption.server';
import { INTEGRATION_ALLOWLIST } from '@/lib/integrations/definitions.server';
import { revalidatePath } from 'next/cache';

import type { ActionResponse } from '@/actions/superadmin/companies';

export async function listIntegrations(companyId: number): Promise<ActionResponse<CompanyIntegration[]>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();
  
  // No traemos las credentials en texto plano por seguridad
  const { data, error } = await adminClient
    .from('company_integrations')
    .select('id, company_id, provider, integration_key, provider_account_id, display_name, connection_type, is_active, status, config, last_sync_at, last_error, sync_frequency, created_at, updated_at, credentials')
    .eq('company_id', companyId);

  if (error) return { success: false, error: error.message };

  const safeData: CompanyIntegration[] = (data || []).map(int => {
    const { credentials, ...rest } = int;
    return {
      ...rest,
      has_credentials: isEncryptedCredentialsEnvelope(credentials)
    };
  });

  return { success: true, data: safeData };
}

export async function saveIntegration(
  companyId: number, 
  integrationKey: WizardIntegrationKey,
  providerAccountId: string,
  rawSecret: string
): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    return { success: false, error: 'companyId inválido' };
  }

  const allowlist = INTEGRATION_ALLOWLIST[integrationKey];
  if (!allowlist) {
    return { success: false, error: 'Integración no permitida' };
  }

  const accountId = providerAccountId.trim();
  const secret = rawSecret.trim();

  if (allowlist.requiresAccountId && !accountId) {
    return { success: false, error: 'Account ID es requerido' };
  }
  if (allowlist.provider === 'meta' && accountId.includes('@')) {
    return { success: false, error: 'El ID de la cuenta no puede ser un correo electrónico' };
  }
  if (accountId.length > 256) {
    return { success: false, error: 'Account ID es demasiado largo' };
  }
  if (secret.length > 2048) {
    return { success: false, error: 'El secreto es demasiado largo' };
  }

  const adminClient = createAdminClient();

  const { data: existing, error: searchError } = await adminClient
    .from('company_integrations')
    .select('id, credentials')
    .eq('company_id', companyId)
    .eq('integration_key', integrationKey)
    .maybeSingle();

  if (searchError) return { success: false, error: searchError.message };

  let resolvedCredentials: Record<string, unknown> | null = null;

  if (!existing) {
    if (!secret && allowlist.credentialKey !== null) {
      return { success: false, error: 'Secreto es obligatorio para una integración nueva' };
    }
    resolvedCredentials = allowlist.credentialKey !== null ? encryptCredentials({ [allowlist.credentialKey]: secret }) : null;
  } else {
    if (secret && allowlist.credentialKey !== null) {
      resolvedCredentials = encryptCredentials({ [allowlist.credentialKey]: secret });
    } else {
      if (isEncryptedCredentialsEnvelope(existing.credentials)) {
        resolvedCredentials = existing.credentials as Record<string, unknown>;
      } else if (allowlist.credentialKey === null) {
        resolvedCredentials = null;
      } else {
        return { success: false, error: 'Se requiere ingresar el secreto nuevamente por motivos de seguridad' };
      }
    }
  }

  const { error } = await adminClient
    .from('company_integrations')
    .upsert({
      company_id: companyId,
      provider: allowlist.provider,
      integration_key: integrationKey,
      provider_account_id: accountId || null,
      display_name: allowlist.displayName,
      connection_type: allowlist.connectionType,
      credentials: resolvedCredentials,
      config: {},
      is_active: true,
      status: 'connected',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'company_id,integration_key'
    });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${companyId}`);
  
  return { success: true, data: undefined };
}

export async function disconnectIntegration(id: string, companyId: number): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('company_integrations')
    .update({
      credentials: null,
      is_active: false,
      status: 'disconnected',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${companyId}`);
  
  return { success: true, data: undefined };
}

export async function deleteIntegration(id: string, companyId: number): Promise<ActionResponse<void>> {
  const auth = await requireSuperAdmin();
  if (!auth.success) return { success: false, error: auth.error };
  const adminClient = createAdminClient();
  
  const { error } = await adminClient
    .from('company_integrations')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/superadmin/companies/${companyId}`);
  
  return { success: true, data: undefined };
}
