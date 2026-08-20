import { z } from 'zod';

// ─── Payment Terms ──────────────────────────────────────────────────────────
// Almacenado en company_services.metadata.payment_terms
// No duplica price, currency ni price_type — esos vienen de company_services directamente.

export const PaymentTermsSplitSchema = z.object({
  payment_type:        z.literal('split'),
  upfront_percentage:  z.number().min(1).max(99),
  balance_due:         z.enum(['upon_delivery', 'upon_approval', 'net_30', 'net_15']),
  // Si true, el pago inicial incluye también el primer mantenimiento mensual requerido
  include_first_required_maintenance: z.boolean().optional().default(false),
});

export const PaymentTermsFullUpfrontSchema = z.object({
  payment_type:        z.literal('full_upfront'),
  // Si true, el pago inicial incluye también el primer mantenimiento mensual requerido
  include_first_required_maintenance: z.boolean().optional().default(false),
});

export const PaymentTermsSchema = z.discriminatedUnion('payment_type', [
  PaymentTermsSplitSchema,
  PaymentTermsFullUpfrontSchema,
]);

export type PaymentTerms = z.infer<typeof PaymentTermsSchema>;

// ─── Delivery Time ──────────────────────────────────────────────────────────
// Almacenado en company_services.metadata.delivery_time

export const DeliveryTimeSchema = z.object({
  value: z.number().int().min(1),
  unit:  z.enum(['hours', 'days', 'weeks']),
});

export type DeliveryTime = z.infer<typeof DeliveryTimeSchema>;

// ─── Service Metadata with Payments Extensions ──────────────────────────────
// Tipo de metadata de servicios extendida con campos opcionales de pagos.
// El ServiceForm existente preserva la metadata intacta — no necesita cambios.

export const ServicePaymentMetadataSchema = z.object({
  payment_terms:  PaymentTermsSchema.optional(),
  delivery_time:  DeliveryTimeSchema.optional(),
  // Campos heredados (compatible con metadata preexistente de servicios)
  monthly_maintenance:          z.object({ price: z.number().nonnegative() }).optional(),
  optional_monthly_maintenance: z.object({ price: z.number().nonnegative() }).optional(),
  meta_ads_initial_budget:      z.number().nonnegative().optional(),
  billing_period:               z.string().optional(),
  includes:                     z.array(z.string()).optional(),
}).passthrough(); // Acepta cualquier otro campo existente sin romper

export type ServicePaymentMetadata = z.infer<typeof ServicePaymentMetadataSchema>;

// ─── Payment Settings (company_payment_settings) ────────────────────────────

export const PaymentSettingsInputSchema = z.object({
  bank_name:      z.string().min(1, 'El banco es requerido').max(200),
  account_holder: z.string().min(1, 'El titular es requerido').max(200),
  clabe:          z.string().max(18).nullable().optional(),
  account_number: z.string().max(30).nullable().optional(),
  instructions:   z.string().max(1000).nullable().optional(),
  is_active:      z.boolean().optional().default(true),
}).superRefine((val, ctx) => {
  if (val.is_active) {
    const hasClabe   = val.clabe   && val.clabe.trim().length > 0;
    const hasAccount = val.account_number && val.account_number.trim().length > 0;
    if (!hasClabe && !hasAccount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cuando la configuración está activa debe existir al menos una CLABE o número de cuenta.',
        path: ['clabe'],
      });
    }
  }
});

export type PaymentSettingsInput = z.infer<typeof PaymentSettingsInputSchema>;

export interface PaymentSettings {
  id:             string;
  company_id:     number;
  bank_name:      string;
  account_holder: string;
  clabe:          string | null;
  account_number: string | null;
  instructions:   string | null;
  is_active:      boolean;
  created_at:     string;
  updated_at:     string;
}

// Tipo sin company_id para respuestas de Dashboard (nunca exponer company_id al cliente)
export type PaymentSettingsRow = Omit<PaymentSettings, 'company_id'>;

// ─── Payments (payments table) ───────────────────────────────────────────────

export const RegisterPaymentInputSchema = z.object({
  // lead_session_id como string — lead_memory.id es int8 gestionado por n8n
  lead_session_id: z.string().min(1, 'El lead es requerido'),
  service_id: z.string().uuid().nullable().optional(),
  concept:    z.string().min(1, 'El concepto es requerido').max(300),
  amount:     z.number().positive('El monto debe ser mayor a cero'),
  currency:   z.string().length(3).default('MXN'),
  notes:      z.string().max(1000).nullable().optional(),
  // company_id, confirmed_at, confirmed_by son fijados exclusivamente en el servidor
});

export type RegisterPaymentInput = z.infer<typeof RegisterPaymentInputSchema>;

export interface PaymentRecord {
  id:           string;
  company_id:   number;
  lead_session_id: string;
  service_id:   string | null;
  concept:      string;
  amount:       number;
  currency:     string;
  status:       'confirmed' | 'cancelled';
  confirmed_at: string;
  confirmed_by: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  notes:        string | null;
  created_at:   string;
}

// Tipo sin company_id para respuestas de Dashboard
export type PaymentRow = Omit<PaymentRecord, 'company_id'>;

export const CancelPaymentInputSchema = z.object({
  payment_id: z.string().uuid('ID de pago inválido'),
  notes:      z.string().max(1000).nullable().optional(),
  // cancelled_at y cancelled_by se fijan en el servidor
});

export type CancelPaymentInput = z.infer<typeof CancelPaymentInputSchema>;
