export type PlanType = 'starter' | 'pro' | 'enterprise';
export type WizardIntegrationKey = 'whatsapp_official' | 'facebook_page' | 'rack_erp';

export interface Company {
  id: string;
  name: string;
  slug: string | null;
  industry: string | null;
  plan: PlanType;
  is_active: boolean;
  onboarding_completed_at: string | null;
  onboarding_status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyModule {
  id: string;
  company_id: string;
  module_key: string;
  is_active: boolean;
  activated_at: string | null;
  config: Record<string, any>;
  plan_required: PlanType;
  created_at: string;
  updated_at: string;
}

export interface CompanyIntegration {
  id: string;
  company_id: number;
  provider: 'meta' | 'rack' | 'shopify' | 'woocommerce' | 'microsip' | 'manual' | 'google' | 'tiktok' | 'stripe';
  integration_key: string;
  provider_account_id: string | null;
  display_name: string | null;
  connection_type: 'oauth' | 'api_key' | 'webhook' | 'manual';
  is_active: boolean;
  status: 'connected' | 'disconnected' | 'error';
  config: Record<string, any>;
  last_sync_at: string | null;
  last_error: string | null;
  sync_frequency: string;
  created_at: string;
  updated_at: string;
  has_credentials: boolean;
}

export interface AiConfig {
  ai_identity?: string;
  ai_business_rules?: string;
  ai_commercial_style?: string;
  ai_constraints?: string;
  ai_knowledge_sources?: any[];
}

export interface OnboardingData {
  companyName: string;
  slug: string;
  industry: string;
  plan: PlanType;
  adminEmail: string;
  adminName?: string;
}

export interface ProductCSVRow {
  sku: string;
  name: string;
  description?: string;
  price?: number;
  cost_price?: number;
  stock?: number;
  min_stock?: number;
  unit?: string;
  category?: string;
  image_url?: string;
}

export interface ProductInsert {
  company_id: number;
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
  source: string;
  metadata: Record<string, any>;
}

export interface ImportResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  errors: Array<{ row: number; error: string }>;
}
