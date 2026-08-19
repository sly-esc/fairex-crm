import { z } from 'zod';

// ─── Business Profile ──────────────────────────────────────────────────────

export const BusinessHoursEntrySchema = z.object({
  day:     z.string().min(1).max(20),
  open:    z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  close:   z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM requerido'),
  is_open: z.boolean(),
});

export const BusinessFAQSchema = z.object({
  question: z.string().min(1).max(500),
  answer:   z.string().min(1).max(2000),
});

export const BusinessProfileSchema = z.object({
  business_name:          z.string().max(200).nullable().optional(),
  description:            z.string().max(2000).nullable().optional(),
  address:                z.string().max(500).nullable().optional(),
  service_areas:          z.array(z.string().min(1).max(100)).max(20).optional(),
  business_hours:         z.array(BusinessHoursEntrySchema).max(7).optional(),
  phones:                 z.array(z.string().min(7).max(20)).max(10).optional(),
  emails:                 z.array(z.string().email()).max(10).optional(),
  website:                z.string().url().nullable().optional(),
  payment_methods:        z.array(z.string().min(1).max(100)).max(20).optional(),
  purchase_process:       z.string().max(2000).nullable().optional(),
  policies:               z.string().max(3000).nullable().optional(),
  faqs:                   z.array(BusinessFAQSchema).max(30).optional(),
  human_handoff:          z.string().max(1000).nullable().optional(),
  additional_information: z.string().max(2000).nullable().optional(),
});

export type BusinessProfileInput = z.infer<typeof BusinessProfileSchema>;

// ─── Company Services ──────────────────────────────────────────────────────

export const ServiceSchema = z.object({
  name:        z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  price:       z.number().nonnegative().nullable().optional(),
  currency:    z.string().length(3),
  price_type:  z.enum(['fixed', 'from', 'quote', 'free']),
  category:    z.string().max(100).nullable().optional(),
  is_active:   z.boolean().optional().default(true),
  metadata:    z.record(z.string(), z.unknown()).optional().default({}),
}).superRefine((val, ctx) => {
  if ((val.price_type === 'fixed' || val.price_type === 'from') && val.price == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Precio obligatorio para fixed o from', path: ['price'] });
  }
  if ((val.price_type === 'quote' || val.price_type === 'free') && val.price != null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Los servicios sin precio no deben tener valor numérico', path: ['price'] });
  }
});

export type ServiceInput = z.infer<typeof ServiceSchema>;

// Tipo completo que refleja la fila de DB
export interface CompanyService {
  id: string;
  company_id: number;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  price_type: 'fixed' | 'from' | 'quote' | 'free';
  category: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Tipo parcial que refleja exactamente los campos del SELECT en las queries de cliente
// No usar CompanyService directamente en respuestas de Supabase con SELECT parcial
export type CompanyServiceRow = Omit<CompanyService, 'company_id'>;
