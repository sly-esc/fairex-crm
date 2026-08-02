import 'server-only';
import { WizardIntegrationKey } from '@/types/superadmin';

export const INTEGRATION_ALLOWLIST: Record<WizardIntegrationKey, {
  provider: 'meta' | 'rack' | 'ycloud';
  displayName: string;
  connectionType: 'api_key' | 'webhook';
  credentialKey: string | null;
  requiresAccountId: boolean;
}> = {
  whatsapp_official: {
    provider: 'meta',
    displayName: 'Meta: WhatsApp Business',
    connectionType: 'api_key',
    credentialKey: 'token',
    requiresAccountId: true,
  },
  facebook_page: {
    provider: 'meta',
    displayName: 'Meta: Facebook Page',
    connectionType: 'api_key',
    credentialKey: 'token',
    requiresAccountId: true,
  },
  rack_erp: {
    provider: 'rack',
    displayName: 'Rack ERP',
    connectionType: 'api_key',
    credentialKey: 'api_key',
    requiresAccountId: false,
  },
  ycloud_whatsapp: {
    provider: 'ycloud',
    displayName: 'YCloud: WhatsApp API',
    connectionType: 'webhook',
    credentialKey: null,
    requiresAccountId: true,
  }
};
