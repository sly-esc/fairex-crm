# FAIREX AI BUSINESS OS — ARCHITECTURE

> **Estado:** ✅ V1.0.1 Definitiva — Congelada para producción  
> **Actualizado:** 16 Jun 2026  
> **FASE 3 (Multiempresa):** Completada y ejecutada en Supabase  
> **FASE 4 (RLS):** En etapa de diseño y auditoría arquitectónica

---

## 1. Flujo de Datos Oficial (OBLIGATORIO — No modificar)

Este flujo es la ley arquitectónica de FAIREX. Toda funcionalidad presente y futura **debe** respetarlo sin excepción:

```
Supabase (PostgreSQL + Auth)
   ↓
src/lib/services/queries.ts   ← ÚNICA puerta de entrada a la base de datos
   ↓
src/components/providers/DataProvider.tsx   ← Inyecta datos al arrancar la app
   ↓
src/lib/store.ts (Zustand — useAppStore)   ← Estado global en memoria
   ↓
Componentes UI React   ← Solo leen, nunca consultan directamente a Supabase
```

**Regla cardinal:** Ningún componente de la UI puede realizar consultas a Supabase directamente. Toda comunicación con la base de datos pasa exclusivamente por `queries.ts`.

---

## 2. Estructura de Carpetas

```text
/src
 ├── app
 │   ├── (auth)
 │   │   └── login/              # Login + Server Actions de autenticación
 │   ├── (dashboard)             # Rutas protegidas del CRM
 │   │   ├── dashboard/          # KPIs, Briefing IA, Distribución de Leads
 │   │   ├── leads/              # Directorio de leads + Perfil CRM /[id]
 │   │   ├── pipeline/           # Kanban Board con Drag & Drop (dnd-kit)
 │   │   ├── conversaciones/     # Chat IA — conectado a n8n_chat_histories
 │   │   ├── tasks/              # Tareas — EmptyState (tabla Supabase pendiente)
 │   │   ├── notifications/      # Alertas — EmptyState (tabla Supabase pendiente)
 │   │   └── settings/           # Branding White-Label + Config IA oculta
 │   ├── globals.css             # Tailwind v4 directives, @theme inline
 │   └── layout.tsx              # Layout maestro con DataProvider + ThemeProvider
 ├── components
 │   ├── layout/                 # AppSidebar, TopHeader, ThemeProvider
 │   ├── providers/              # DataProvider (carga datos de Supabase al inicio)
 │   ├── premium/                # StatCard y componentes de alto nivel
 │   └── ui/                     # Shadcn UI: Button, Input, Card, EmptyState...
 ├── lib
 │   ├── store.ts                # Zustand global store — clave: 'fairex-v1-storage'
 │   ├── services/
 │   │   └── queries.ts          # Server Actions — ÚNICA capa de acceso a Supabase
 │   ├── utils/
 │   │   └── stages.ts           # Normalización de etapas del pipeline
 │   ├── utils.ts                # clsx + twMerge helpers
 │   └── supabase/               # Clientes server y client de Supabase
 │       ├── client.ts           # createBrowserClient (@supabase/ssr)
 │       ├── server.ts           # createServerClient (@supabase/ssr)
 │       └── middleware.ts       # updateSession — protección de rutas
```

---

## 3. Tablas Supabase — Estado Actual (FASE 3 COMPLETADA)

| Tabla | Acceso | `company_id` | FK a `companies` | Notas |
|---|---|---|---|---|
| `companies` | Lectura | N/A (PK `id int8`) | N/A | Empresa `id=1` confirmada |
| `profiles` (ex-`users`) | Lectura | ✅ `int8`, `NOT NULL`, `DEFAULT 1` | ✅ `ON DELETE RESTRICT` | Backfill histórico completado |
| `lead_memory` | Lectura + `UPDATE estado` | ✅ `int8`, `NOT NULL`, `DEFAULT 1` | ✅ `ON DELETE RESTRICT` | Backfill histórico completado |
| `n8n_chat_histories` | Solo lectura | ✅ `int8`, `NOT NULL`, `DEFAULT 1` | ✅ `ON DELETE RESTRICT` (fk_chat_company) | Parche quirúrgico aplicado |
| `auth.users` | Solo lectura (Supabase Auth) | N/A | N/A | Sesión, email y perfil del usuario |

---

## 4. Zustand Store (`store.ts`)

**Clave de persistencia:** `fairex-v1-storage`

El store controla en memoria:
- `pipelineLeads`: Array de leads reales desde `lead_memory`
- `conversations`: Metadatos de cada conversación (nombre, resumen, tiempo)
- `notifications`: Array vacío — EmptyState activo (sin tabla Supabase aún)
- `tasks`: Array vacío — EmptyState activo (sin tabla Supabase aún)
- `branding`: Color primario HEX y logo URL para White-Label
- `company`: Nombre, web y dirección de la empresa
- `user`: Perfil del usuario autenticado (nombre, email, initials)
- `_hasHydrated`: Guard de hidratación para prevenir Hydration Mismatch en SSR

**Middleware:** `persist` con `partialize` — solo persiste los campos necesarios en `localStorage`.

---

## 5. ThemeProvider

- Lee `branding.primaryColor` desde Zustand
- Inyecta `<style>` con variable CSS nativa `--primary`
- Todo componente consume `var(--primary)` — Tailwind v4 compatible
- Variaciones de opacidad (glows, sombras) resueltas con `color-mix(in srgb, var(--primary) X%, transparent)`

---

## 6. Autenticación y Protección de Rutas

```
Usuario no autenticado
   → middleware.ts ejecuta updateSession()
   → Supabase verifica la cookie de sesión
   → Sin sesión válida → redirect /login
   → Con sesión válida → acceso al (dashboard)

Logout (TopHeader.tsx)
   → supabase.auth.signOut() destruye la cookie
   → router.push('/login') + router.refresh()
   → middleware detecta sesión inexistente → permite /login
```

---

## 7. Tablas Supabase — Reglas de Modificación

- **`lead_memory`**: Solo N8N escribe. El Dashboard solo hace `UPDATE estado` o `UPDATE etapa_venta`.
- **`n8n_chat_histories`**: Inmutable desde el Dashboard. Solo lectura.
- **No eliminar columnas.** Toda evolución es aditiva.
- **IDs:** Todo el sistema usa `int8` (BigInt). No migrar a UUID.
- **No exponer Service Role Key** en ningún componente cliente.

---

## 8. Aislamiento Multiempresa — FASE 3 COMPLETADA ✅

> **Estado:** Ejecutada en producción. Todas las tablas críticas tienen `company_id`. Backfill completo. Foreign Keys activas. Sistema verificado y congelado.

El mecanismo de aislamiento activo (nivel de aplicación):

```
Usuario autenticado
   → getUserCompanyId() lee la sesión
   → Consulta tabla 'profiles' → obtiene company_id (con fallback seguro a 1)
   → Todos los SELECT y UPDATE filtran .eq('company_id', companyId)
   → La UI y Zustand reciben únicamente los datos de su empresa
```

Garantías activas en producción:
- N8N inyecta leads con `company_id DEFAULT 1` automáticamente.
- Un único conjunto de flujos N8N sirve a todos los tenants.
- Todas las FK operan bajo `ON DELETE RESTRICT`.
- Sin RLS aún — el aislamiento es a nivel de Server Action. **FASE 4 activará RLS nativo.**

## 9. Row Level Security (RLS) — Diseño FASE 4 (En Auditoría)

> **Estado:** En diseño. No ejecutado. La arquitectura actual es segura para un tenant único. RLS será necesario antes de operar con múltiples empresas reales.

**Tablas objetivo:** `profiles`, `lead_memory`, `n8n_chat_histories`  
**Mecanismo:** `auth.uid()` → `profiles.user_id` → `profiles.company_id`  
**Política base:** `USING (company_id = (SELECT company_id FROM profiles WHERE user_id = auth.uid()))`

---

## 9. Reglas para Futuras Fases

Toda nueva fase debe respetar estrictamente:

1. El flujo `Supabase → queries.ts → DataProvider → Zustand → UI`.
2. Las tablas existentes no se modifican destructivamente.
3. Nuevas funcionalidades se añaden como nuevas tablas o columnas aditivas.
4. La Service Role Key permanece exclusivamente en entorno servidor.
5. Toda tabla nueva en FASE 4+ requiere Row Level Security (RLS) con aislamiento por `company_id`.
6. Los flujos de N8N no se modifican desde el Dashboard bajo ninguna circunstancia.
