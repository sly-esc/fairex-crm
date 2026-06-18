# FAIREX AI BUSINESS OS — V2 COMPATIBILITY AUDIT

> **Versión:** 2.0  
> **Fecha:** 2026-06-01  
> **Tipo:** Auditoría Técnica de Compatibilidad  
> **Perspectiva:** CTO Enterprise — Evolución, no reconstrucción  

---

## PRINCIPIO RECTOR

> [!CAUTION]
> **FAIREX ya tiene un motor funcional en producción.** El backend de IA, los workflows de n8n, la integración con WhatsApp, el scoring, el FollowUp y el Retargeting **ya funcionan y generan valor**. Cualquier decisión arquitectónica que rompa estos workflows es inaceptable. El frontend es una **cabina de cristal** que se monta SOBRE el motor existente — no lo reemplaza.

---

## INVENTARIO DE INFRAESTRUCTURA EXISTENTE

### Lo que YA existe y FUNCIONA

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCCIÓN ACTUAL                          │
│                                                             │
│  ┌───────────────────────────────────────────────┐          │
│  │              n8n (Orquestador)                │          │
│  │                                               │          │
│  │  ✅ Recepción de mensajes WhatsApp            │          │
│  │  ✅ Agente IA Principal (análisis)            │          │
│  │  ✅ Scoring automático                        │          │
│  │  ✅ Clasificación de etapa de venta           │          │
│  │  ✅ FollowUp IA (programación + envío)        │          │
│  │  ✅ Retargeting IA (reactivación)             │          │
│  │  ✅ Escritura a Supabase                      │          │
│  └───────────────────┬───────────────────────────┘          │
│                      │                                       │
│                      ▼                                       │
│  ┌───────────────────────────────────────────────┐          │
│  │           Supabase (Persistencia)             │          │
│  │                                               │          │
│  │  ✅ clientes              (datos del lead)    │          │
│  │  ✅ conversaciones        (sesiones de chat)  │          │
│  │  ✅ lead_memory           (cerebro IA)        │          │
│  │  ✅ n8n_chat_history      (mensajes raw)      │          │
│  └───────────────────────────────────────────────┘          │
│                                                             │
│  ┌───────────────────────────────────────────────┐          │
│  │           WhatsApp Business API               │          │
│  │                                               │          │
│  │  ✅ Recepción de mensajes                     │          │
│  │  ✅ Envío de respuestas                       │          │
│  │  ✅ Integrado con n8n                         │          │
│  └───────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Tabla Central: lead_memory

```
lead_memory (TABLA SAGRADA — NO MODIFICAR ESTRUCTURA CORE)
├── resumen_inteligente          ✅ Generado por IA via n8n
├── score_lead                   ✅ Calculado por IA via n8n
├── etapa_venta                  ✅ Determinado por IA via n8n
├── nivel_interes                ✅ Evaluado por IA via n8n
├── objeciones                   ✅ Extraídas por IA via n8n
├── necesidades                  ✅ Extraídas por IA via n8n
├── prioridad                    ✅ Calculada por IA via n8n
├── listo_cerrar                 ✅ Determinado por IA via n8n
├── followup_pendiente           ✅ Gestionado por n8n
├── fecha_followup               ✅ Programado por n8n
├── intentos_followup            ✅ Controlado por n8n
├── retargeting_pendiente        ✅ Gestionado por n8n
├── fecha_retargeting            ✅ Programado por n8n
├── intentos_retargeting         ✅ Controlado por n8n
└── ultimo_retargeting           ✅ Registrado por n8n
```

---

## 1. AUDITORÍA DE MÓDULOS: QUÉ CONSTRUIR Y QUÉ NO

### 1.1 Clasificación de Cada Módulo

| Módulo | Estado | Veredicto | Acción |
|--------|--------|-----------|--------|
| **M01 — Auth + Onboarding** | 🆕 No existe | CONSTRUIR AHORA | Nuevo. No toca nada existente. |
| **M02 — Multi-tenant** | 🆕 No existe | CONSTRUIR AHORA (parcial) | Agregar `company_id` a tablas existentes. Migración cuidadosa. |
| **M03 — Usuarios y Roles** | 🆕 No existe | CONSTRUIR AHORA | Nuevo. Supabase Auth + tabla nueva. |
| **M04 — CRM Core** | ✅ EXISTE parcial | FRONTEND NUEVO sobre datos existentes | `clientes` + `lead_memory` ya son el CRM. Construir UI que LEA de ellas. |
| **M05 — Conversaciones** | ✅ EXISTE parcial | FRONTEND NUEVO sobre datos existentes | `conversaciones` + `n8n_chat_history` ya tienen los datos. Construir UI. |
| **M06 — Motor IA** | ✅ EXISTE en n8n | NO TOCAR | Los agentes IA ya corren en n8n. El frontend solo MUESTRA resultados de `lead_memory`. |
| **M07 — Pipeline** | ✅ EXISTE en lead_memory | FRONTEND NUEVO | `lead_memory.etapa_venta` ya existe. Construir vista Kanban que lea de ahí. |
| **M08 — Notificaciones** | 🆕 No existe | CONSTRUIR AHORA | Tabla nueva. No toca workflows. |
| **M09 — Dashboard Ejecutivo** | 🆕 No existe | CONSTRUIR AHORA | Queries sobre `lead_memory` + `clientes` + `conversaciones`. Solo lectura. |
| **M10 — Dashboard Vendedores** | 🆕 No existe | CONSTRUIR AHORA | Queries sobre datos existentes. Solo lectura. |
| **M11 — Calendario** | 🆕 No existe | FASE 2 | Tabla nueva. No urgente para MVP comercial. |
| **M12 — Tareas** | 🆕 No existe | CONSTRUIR AHORA | Tabla nueva. Puede leer de `lead_memory` para auto-generar. |
| **M13 — Reportes** | 🆕 No existe | FASE 2 | Queries sobre datos existentes. No urgente para MVP. |
| **M14 — Marketing Intelligence** | 🆕 No existe | FASE 3+ | Futuro. No construir ahora. |
| **M15 — Canales adicionales** | ✅ WhatsApp existe | FASE 2-3 | WhatsApp funciona. FB/IG/Telegram/Email son expansión futura. |
| **M16 — Automatizaciones** | ✅ EXISTE en n8n | NO TOCAR (solo panel de visibilidad) | n8n es el motor. Opcionalmente construir dashboard de monitoreo. |
| **M17 — Billing** | 🆕 No existe | FASE 2 | Necesario para cobrar pero no para el MVP funcional inicial. |
| **M18 — Configuración** | 🆕 No existe | CONSTRUIR AHORA (básico) | Config de empresa, equipo, canales. Tabla nueva. |

### 1.2 Resumen Visual

```
CONSTRUIR INMEDIATAMENTE (MVP)          YA EXISTE (NO TOCAR)
─────────────────────────────           ────────────────────
✅ M01 Auth + Onboarding                ✅ M06 Motor IA (n8n)
✅ M02 Multi-tenant (migración)         ✅ M16 Automatizaciones (n8n)
✅ M03 Usuarios y Roles                 ✅ WhatsApp Integration
✅ M04 CRM UI (sobre clientes          ✅ FollowUp IA
       + lead_memory)                   ✅ Retargeting IA
✅ M05 Conversaciones UI (sobre         ✅ Scoring IA
       conversaciones +                 ✅ Pipeline IA
       n8n_chat_history)
✅ M07 Pipeline UI (Kanban)
✅ M08 Notificaciones
✅ M09 Dashboard Ejecutivo
✅ M10 Dashboard Vendedores
✅ M12 Tareas
✅ M18 Config (básico)

FASE 2 (POST-MVP)                       FASE 3+ (FUTURO)
─────────────────                        ────────────────
⏳ M11 Calendario                        🔮 M14 Marketing Intelligence
⏳ M13 Reportes avanzados                🔮 Visual Automation Builder
⏳ M17 Billing                           🔮 Canales adicionales
⏳ M15 Multi-canal                       🔮 API pública
⏳ Gamificación vendedores               🔮 Mobile app nativa
```

---

## 2. TABLAS NUEVAS REALMENTE NECESARIAS

> [!IMPORTANT]
> El documento original proponía 14+ tablas nuevas. Tras auditoría contra la infraestructura existente, **solo 9 tablas nuevas son necesarias** para el MVP comercial. Ninguna reemplaza ni duplica tablas existentes.

### 2.1 Tablas Nuevas para MVP

```
TABLA NUEVA                  PROPÓSITO                           PRIORIDAD
─────────────────────────────────────────────────────────────────────────────

1. companies                 Registro de empresas/tenants        🔴 MVP
                             Multi-tenancy

2. company_members           Relación usuario ↔ empresa          🔴 MVP
                             Roles y permisos

3. user_profiles             Datos extendidos del usuario        🔴 MVP
                             (nombre, avatar, preferencias)
                             Complementa auth.users de Supabase

4. tasks                     Sistema de tareas                   🔴 MVP
                             (manuales + auto-generadas)

5. notifications             Alertas y notificaciones            🔴 MVP
                             in-app

6. company_settings          Configuración por empresa           🔴 MVP
                             (IA, scoring, pipeline, branding)

7. activity_log              Registro de actividad               🟡 Fase 2
                             (timeline del lead)

8. calendar_events           Calendario inteligente              🟡 Fase 2

9. channel_lines             Config de líneas/canales            🟡 Fase 2
                             por empresa
```

### 2.2 Tablas del Documento Original que NO se necesitan

| Tabla Propuesta | Razón de Exclusión |
|----------------|-------------------|
| `leads` | **YA EXISTE como `clientes`**. No crear tabla duplicada. |
| `messages` | **YA EXISTE como `n8n_chat_history`**. No duplicar mensajes. |
| `conversations` (nueva) | **YA EXISTE como `conversaciones`**. Agregar columnas, no reemplazar. |
| `ai_interactions` | Innecesario para MVP. Los logs de n8n ya registran ejecuciones de IA. Considerar en Fase 3+. |
| `plans` | Hardcodear planes en código para MVP. Tabla en Fase 2 cuando se agregue billing. |
| `subscriptions` | Fase 2 con billing. |

### 2.3 Esquema de Tablas Nuevas (Solo MVP)

```sql
-- ═══════════════════════════════════════════════
-- TABLA 1: companies
-- Registro de empresas. Base del multi-tenancy.
-- ═══════════════════════════════════════════════
companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  industry          TEXT,                    -- clínica, inmobiliaria, agencia...
  country           TEXT DEFAULT 'MX',
  logo_url          TEXT,
  plan              TEXT DEFAULT 'starter',  -- starter | pro | enterprise
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
)

-- ═══════════════════════════════════════════════
-- TABLA 2: company_members
-- Quién pertenece a qué empresa y con qué rol.
-- ═══════════════════════════════════════════════
company_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) NOT NULL,
  user_id           UUID REFERENCES auth.users(id) NOT NULL,
  role              TEXT NOT NULL DEFAULT 'vendedor',
                    -- owner | director | supervisor | vendedor
  is_active         BOOLEAN DEFAULT true,
  invited_by        UUID REFERENCES auth.users(id),
  joined_at         TIMESTAMPTZ DEFAULT now(),

  UNIQUE(company_id, user_id)
)

-- ═══════════════════════════════════════════════
-- TABLA 3: user_profiles
-- Datos de perfil extendidos. Complementa auth.users.
-- ═══════════════════════════════════════════════
user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name         TEXT NOT NULL,
  avatar_url        TEXT,
  phone             TEXT,
  timezone          TEXT DEFAULT 'America/Mexico_City',
  notification_prefs JSONB DEFAULT '{"app": true, "email": true, "whatsapp": false}',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
)

-- ═══════════════════════════════════════════════
-- TABLA 4: tasks
-- Sistema de tareas. Lee de lead_memory pero NO escribe en ella.
-- ═══════════════════════════════════════════════
tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  assigned_to       UUID REFERENCES company_members(id),
  lead_id           UUID,                    -- FK a clientes.id
  lead_memory_id    UUID,                    -- FK a lead_memory.id (para contexto)
  source            TEXT DEFAULT 'manual',
                    -- manual | ai_hotlead | ai_followup | ai_director | system
  priority          TEXT DEFAULT 'medium',   -- low | medium | high | urgent
  status            TEXT DEFAULT 'pending',  -- pending | in_progress | completed | cancelled
  due_date          TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
)

-- ═══════════════════════════════════════════════
-- TABLA 5: notifications
-- Alertas in-app. Generadas por eventos del sistema.
-- ═══════════════════════════════════════════════
notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) NOT NULL,
  user_id           UUID REFERENCES company_members(id) NOT NULL,
  type              TEXT NOT NULL,
                    -- hot_lead | new_message | followup_due | task_due
                    -- task_overdue | ai_insight | system | team_alert
  title             TEXT NOT NULL,
  body              TEXT,
  data              JSONB,                   -- { lead_id, link, action... }
  is_read           BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
)

-- ═══════════════════════════════════════════════
-- TABLA 6: company_settings
-- Config por empresa. Separada de companies para no sobrecargar.
-- ═══════════════════════════════════════════════
company_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) UNIQUE NOT NULL,
  ai_config         JSONB DEFAULT '{
                      "tone": "profesional",
                      "language": "es-MX",
                      "auto_response": true,
                      "business_hours": {"start": "08:00", "end": "20:00"}
                    }',
  scoring_config    JSONB DEFAULT '{
                      "hot_lead_threshold": 90,
                      "factors": []
                    }',
  pipeline_stages   JSONB DEFAULT '[
                      "contacto_inicial", "interesado", "seguimiento",
                      "caliente", "listo_cerrar", "cerrado", "perdido"
                    ]',
  branding          JSONB DEFAULT '{
                      "primary_color": "#6366f1",
                      "logo_url": null
                    }',
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
)
```

---

## 3. COLUMNAS NUEVAS EN TABLAS EXISTENTES

> [!WARNING]
> Toda columna nueva debe ser **nullable** o tener **default value** para no romper inserts existentes desde n8n. Los workflows de n8n NO deben requerir modificación para seguir funcionando.

### 3.1 Tabla: clientes

```sql
-- AGREGAR a clientes (columnas nuevas, todas opcionales/con default):

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  company_id        UUID REFERENCES companies(id);
  -- Para multi-tenancy. Inicialmente NULL, se migra con valor
  -- del primer tenant. n8n no necesita enviar este campo si
  -- se configura un DEFAULT o trigger.

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  assigned_to       UUID REFERENCES company_members(id);
  -- Vendedor asignado. NULL = sin asignar.

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  source            TEXT;
  -- Canal de origen: 'whatsapp' | 'messenger' | 'instagram' | 'manual' | ...

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  tags              TEXT[];
  -- Etiquetas: ['premium', 'cdmx', 'urgente']

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  valor_estimado    DECIMAL(12,2);
  -- Valor monetario estimado del deal. Para pipeline con valor.

ALTER TABLE clientes ADD COLUMN IF NOT EXISTS
  updated_at        TIMESTAMPTZ DEFAULT now();
  -- Si no existe. Para tracking de cambios.
```

**Impacto en n8n:** CERO. Todas las columnas son nullable. n8n sigue escribiendo los mismos campos que escribe hoy. Las nuevas columnas las llena el frontend o triggers de DB.

### 3.2 Tabla: lead_memory

```sql
-- AGREGAR a lead_memory (columnas nuevas, todas opcionales/con default):

ALTER TABLE lead_memory ADD COLUMN IF NOT EXISTS
  company_id        UUID REFERENCES companies(id);
  -- Multi-tenancy. Migrar con valor del primer tenant.

ALTER TABLE lead_memory ADD COLUMN IF NOT EXISTS
  ultima_accion     TEXT;
  -- Próxima acción recomendada. Si n8n ya la genera, omitir.

ALTER TABLE lead_memory ADD COLUMN IF NOT EXISTS
  sentimiento       TEXT;
  -- 'positivo' | 'neutral' | 'negativo'. Si n8n ya lo genera, omitir.

ALTER TABLE lead_memory ADD COLUMN IF NOT EXISTS
  fecha_ultimo_contacto  TIMESTAMPTZ;
  -- Timestamp del último mensaje. Útil para dashboards.
  -- Puede llenarse con trigger en n8n_chat_history.

ALTER TABLE lead_memory ADD COLUMN IF NOT EXISTS
  motivo_perdida    TEXT;
  -- Si etapa_venta = 'perdido'. Llenado manual o por IA.
```

**Impacto en n8n:** CERO. n8n sigue escribiendo exactamente los mismos campos. Las nuevas columnas son opcionales. Si los workflows de n8n ya generan `ultima_accion` o `sentimiento`, NO crear esas columnas (evitar duplicación).

### 3.3 Tabla: conversaciones

```sql
-- AGREGAR a conversaciones:

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS
  company_id        UUID REFERENCES companies(id);

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS
  assigned_to       UUID REFERENCES company_members(id);
  -- Vendedor responsable de esta conversación.

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS
  status            TEXT DEFAULT 'open';
  -- 'open' | 'pending' | 'closed'

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS
  unread_count      INTEGER DEFAULT 0;
  -- Contador de no leídos. Se actualiza con trigger.

ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS
  last_message_at   TIMESTAMPTZ;
  -- Para ordenar conversaciones por actividad reciente.
```

**Impacto en n8n:** CERO. Misma estrategia: nullable + defaults.

### 3.4 Tabla: n8n_chat_history

```sql
-- AGREGAR a n8n_chat_history:

ALTER TABLE n8n_chat_history ADD COLUMN IF NOT EXISTS
  company_id        UUID REFERENCES companies(id);
  -- Solo para filtrado multi-tenant en el frontend.

ALTER TABLE n8n_chat_history ADD COLUMN IF NOT EXISTS
  is_read           BOOLEAN DEFAULT false;
  -- Para marcar mensajes como leídos desde el frontend.
```

**Impacto en n8n:** CERO. n8n nunca lee `is_read` ni `company_id`.

### 3.5 Resumen de Migraciones

```
┌──────────────────────┬───────────────────────┬───────────────────┐
│ Tabla                │ Columnas Nuevas       │ Impacto n8n       │
├──────────────────────┼───────────────────────┼───────────────────┤
│ clientes             │ company_id            │ CERO              │
│                      │ assigned_to           │ (todas nullable   │
│                      │ source                │  con defaults)    │
│                      │ tags                  │                   │
│                      │ valor_estimado        │                   │
│                      │ updated_at            │                   │
├──────────────────────┼───────────────────────┼───────────────────┤
│ lead_memory          │ company_id            │ CERO              │
│                      │ ultima_accion*        │ *Solo si n8n      │
│                      │ sentimiento*          │  no las genera    │
│                      │ fecha_ultimo_contacto │                   │
│                      │ motivo_perdida        │                   │
├──────────────────────┼───────────────────────┼───────────────────┤
│ conversaciones       │ company_id            │ CERO              │
│                      │ assigned_to           │                   │
│                      │ status                │                   │
│                      │ unread_count          │                   │
│                      │ last_message_at       │                   │
├──────────────────────┼───────────────────────┼───────────────────┤
│ n8n_chat_history     │ company_id            │ CERO              │
│                      │ is_read               │                   │
└──────────────────────┴───────────────────────┴───────────────────┘

Total: ~18 columnas nuevas distribuidas en 4 tablas existentes
Rotura de n8n: NINGUNA
```

### 3.6 Estrategia de Migración para company_id

```
PASO 1: Crear tabla companies con empresa inicial
PASO 2: Agregar columna company_id (nullable) a las 4 tablas
PASO 3: UPDATE masivo: SET company_id = [id_empresa_inicial]
        para todos los registros existentes
PASO 4: Crear trigger/default para nuevos registros:
        - Opción A: DEFAULT en la columna (si hay solo 1 empresa)
        - Opción B: Trigger que asigna company_id basándose en
                    el channel/número de WhatsApp
        - Opción C: n8n envía company_id (requiere modificar workflow,
                    hacer SOLO cuando sea necesario multi-tenant real)
PASO 5: Crear RLS policies
PASO 6: Activar RLS
```

> [!IMPORTANT]
> El Paso 4 es el punto de decisión clave. Para el MVP con un solo tenant, usar **Opción A** (DEFAULT). Solo migrar a Opción B/C cuando haya múltiples empresas reales.

---

## 4. ARQUITECTURA FUTURA vs. CONSTRUIR AHORA

### 4.1 Lo que NO se debe implementar todavía

| Elemento del Doc Original | Razón para Posponer | Fase Real |
|--------------------------|--------------------:|-----------|
| Agente IA Orquestador (frontend) | **Ya funciona en n8n.** No reconstruir. | N/A (existe) |
| Prompt Manager con templates versionados | Over-engineering. Los prompts están en n8n y funcionan. | Fase 3+ |
| Context Window Manager | n8n maneja el contexto. No duplicar. | Fase 3+ |
| Token Budget / AI Usage Metering | No hay múltiples empresas aún. Medir cuando escale. | Fase 2 |
| Response Cache (Redis) | Prematuro. Optimizar cuando haya volumen real. | Fase 3+ |
| Multi-model support (Anthropic, Google) | OpenAI funciona. No agregar complejidad. | Fase 3+ |
| Visual Automation Builder | n8n ES el automation builder. No reconstruir. | Fase 4+ |
| Particionamiento de tablas | No hay millones de filas. Prematuro. | Fase 4+ |
| Read replicas | No hay carga suficiente. | Fase 4+ |
| Microservicios | Monolito Next.js es correcto para esta escala. | Fase 4+ |
| Email marketing / SMS | Fuera de scope MVP. | Fase 3+ |
| Landing page builder | Fuera de scope MVP. | Fase 3+ |
| Formularios web | Útil pero no esencial si WhatsApp es el canal principal. | Fase 2 |
| Propuestas / Cotizaciones | No es core del producto. | Fase 3+ |
| Customer portal | No es core. | Fase 4+ |
| App marketplace | Demasiado pronto. | Fase 4+ |
| SSO/SAML | Solo Enterprise. No hay clientes Enterprise aún. | Fase 3+ |
| White-label | Complejidad innecesaria ahora. | Fase 3+ |
| Mobile app nativa | PWA es suficiente para MVP. | Fase 3+ |
| Revenue forecasting ML | Requiere datos históricos que aún no existen. | Fase 3+ |
| AI fine-tuning por industria | Requiere volumen de datos. | Fase 4+ |
| Catálogo de productos | No es core para la primera versión. | Fase 2 |
| Deal/Opportunity con valor monetario | La columna `valor_estimado` en `clientes` es suficiente. | Fase 2 (completo) |

### 4.2 Lo que SÍ se debe implementar ahora

```
MVP COMERCIAL — Lo mínimo para empezar a vender FAIREX
─────────────────────────────────────────────────────────

1. 🔐 Autenticación
   Login · Registro · Recuperar contraseña
   Supabase Auth (ya incluido)

2. 🏢 Multi-tenancy básico
   Tabla companies + company_members
   company_id en tablas existentes (con default)
   RLS policies básicas

3. 👥 Gestión de usuarios
   Invitar usuarios · Asignar roles
   4 roles: owner, director, supervisor, vendedor

4. 📈 Dashboard Ejecutivo
   KPIs leyendo de lead_memory + clientes + conversaciones
   Briefing IA (leyendo resumen_inteligente de lead_memory)
   Alertas de leads calientes (score_lead > 90)

5. 📈 Dashboard Vendedor
   Mis leads · Mis métricas · Mis tareas pendientes
   Ranking básico del equipo

6. 📇 Vista de Leads
   Tabla con filtros leyendo de clientes + lead_memory (JOIN)
   Detalle de lead con análisis IA (de lead_memory)
   Asignación de vendedor

7. 💬 Centro de Conversaciones
   Inbox leyendo de conversaciones + n8n_chat_history
   Chat view en tiempo real (Supabase Realtime)
   Panel derecho: datos de lead_memory (score, etapa, etc.)

8. 🔀 Pipeline (Kanban)
   Vista Kanban leyendo lead_memory.etapa_venta
   Agrupado por etapa · Ordenado por score
   Movimiento manual (update a lead_memory.etapa_venta)

9. 🔔 Notificaciones
   Alertas de leads calientes
   FollowUps pendientes
   Nuevos mensajes

10. ✅ Tareas
    Crear tareas manuales
    Ver tareas auto-generadas (si se agregan desde n8n)
    Marcar como completadas

11. ⚙️ Configuración básica
    Perfil de empresa · Gestión de equipo
    Configuración de IA (leída por n8n o solo visual)

12. 🎨 Design System premium
    Dark mode · Glassmorphism · Animaciones
    Responsive · Componentes reutilizables
```

---

## 5. ARQUITECTURA MÍNIMA PARA MVP COMERCIAL

### 5.1 Diagrama de Arquitectura Real (No Ideal)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   FRONTEND (NUEVO)                BACKEND (EXISTENTE)           │
│                                                                 │
│   ┌─────────────────────┐         ┌─────────────────────┐      │
│   │                     │         │                     │      │
│   │   Next.js App       │         │   n8n               │      │
│   │   ─────────────     │         │   ─────             │      │
│   │                     │         │                     │      │
│   │   • Auth pages      │         │   • WhatsApp recv   │      │
│   │   • Dashboard       │ LECTURA │   • AI Agent        │      │
│   │   • Leads list      │◄────────┤   • Scoring         │      │
│   │   • Lead detail     │         │   • FollowUp        │      │
│   │   • Conversations   │         │   • Retargeting     │      │
│   │   • Pipeline        │         │   • Pipeline mgmt   │      │
│   │   • Tasks           │         │                     │      │
│   │   • Notifications   │         │   ESCRIBE A ──┐     │      │
│   │   • Settings        │         │               │     │      │
│   │                     │         └───────────────┼─────┘      │
│   │   ESCRIBE:          │                         │             │
│   │   • tasks           │                         ▼             │
│   │   • notifications   │         ┌─────────────────────┐      │
│   │   • company_members │         │                     │      │
│   │   • user_profiles   │         │   Supabase          │      │
│   │   • companies       │ LECTURA │   ──────────        │      │
│   │   • clientes.*      │◄────────┤                     │      │
│   │     (assigned_to,   │ & WRITE │   • clientes        │      │
│   │      tags, valor)   │────────►│   • lead_memory     │      │
│   │                     │         │   • conversaciones   │      │
│   │   NO ESCRIBE:       │         │   • n8n_chat_history│      │
│   │   ❌ lead_memory.*  │         │   ─ ─ ─ ─ ─ ─ ─ ─ │      │
│   │     (campos IA)     │         │   • companies  NEW  │      │
│   │   ❌ n8n_chat_hist  │         │   • company_m. NEW  │      │
│   │     (mensajes)      │         │   • tasks      NEW  │      │
│   │                     │         │   • notif.     NEW  │      │
│   └─────────────────────┘         │   • profiles   NEW  │      │
│                                   │   • settings   NEW  │      │
│                                   │                     │      │
│                                   │   Auth (Supabase)   │      │
│                                   │   Realtime (WS)     │      │
│                                   │   Storage (archivos)│      │
│                                   └─────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Reglas de Oro para el Frontend

> [!CAUTION]
> **REGLA 1:** El frontend NUNCA escribe en los campos de IA de `lead_memory` (resumen_inteligente, score_lead, etapa_venta, nivel_interes, objeciones, necesidades, prioridad, listo_cerrar). Esos campos son **propiedad exclusiva de n8n/IA**.

> [!CAUTION]  
> **REGLA 2:** El frontend NUNCA inserta registros en `n8n_chat_history`. Esos registros los crea n8n al procesar mensajes. El frontend solo LEE.

> [!IMPORTANT]
> **REGLA 3:** El frontend PUEDE escribir en campos *operativos* de `clientes` (assigned_to, tags, valor_estimado, source) y `conversaciones` (assigned_to, status, unread_count) porque esos son campos de gestión humana, no de IA.

> [!IMPORTANT]
> **REGLA 4:** Si el vendedor quiere mover manualmente un lead en el pipeline (etapa_venta), esa es la **ÚNICA escritura permitida del frontend a lead_memory**. Se debe documentar que la IA puede re-clasificar en el siguiente análisis.

```
SEPARACIÓN DE RESPONSABILIDADES:

n8n ESCRIBE:                      Frontend ESCRIBE:
──────────────                    ──────────────────
lead_memory.resumen_inteligente   clientes.assigned_to
lead_memory.score_lead            clientes.tags
lead_memory.etapa_venta           clientes.valor_estimado
lead_memory.nivel_interes         clientes.source
lead_memory.objeciones            conversaciones.assigned_to
lead_memory.necesidades           conversaciones.status
lead_memory.prioridad             conversaciones.unread_count
lead_memory.listo_cerrar          tasks.* (tabla nueva)
lead_memory.followup_*            notifications.* (tabla nueva)
lead_memory.retargeting_*         companies.* (tabla nueva)
n8n_chat_history.*                company_members.* (tabla nueva)
                                  user_profiles.* (tabla nueva)
                                  company_settings.* (tabla nueva)

EXCEPCIÓN CONTROLADA:
Frontend PUEDE escribir lead_memory.etapa_venta
(movimiento manual de pipeline por parte del vendedor)
```

---

## 6. COMPONENTES A CONSTRUIR PRIMERO PARA GENERAR VENTAS

### 6.1 Orden de Construcción Orientado a Revenue

```
SEMANA 1-2: CIMIENTOS
─────────────────────
Prioridad: Sin esto NADA funciona

  1. Design system (tokens, componentes base, dark mode)
  2. Layout principal (sidebar, header, responsive)
  3. Auth (login, registro, Supabase Auth setup)
  4. Tablas nuevas en Supabase (companies, company_members,
     user_profiles, company_settings)
  5. Columnas nuevas en tablas existentes (ALTER TABLE)
  6. RLS policies básicas
  7. Middleware de tenant resolution


SEMANA 3-4: EL PRODUCTO QUE VENDE
──────────────────────────────────
Prioridad: Esto es lo que muestra en demos y convence clientes

  8. 📈 DASHBOARD EJECUTIVO ← "WOW factor" para demos
     KPIs en tiempo real leyendo de lead_memory
     Briefing IA con resumen diario
     Cards de métricas con animaciones

  9. 💬 CENTRO DE CONVERSACIONES ← Herramienta diaria del vendedor
     Inbox leyendo de conversaciones + n8n_chat_history
     Chat en tiempo real (Supabase Realtime)
     Panel de análisis IA (datos de lead_memory)

 10. 📇 LEADS + DETALLE ← Core del CRM
     Lista con tabla/filtros desde clientes JOIN lead_memory
     Detalle con score, etapa, objeciones, necesidades
     Asignación de vendedor


SEMANA 5-6: PROFUNDIDAD COMERCIAL
──────────────────────────────────
Prioridad: Features que completan la propuesta de valor

 11. 🔀 PIPELINE KANBAN ← Visual e impactante para demos
     Cards por etapa desde lead_memory.etapa_venta
     Drag & drop (con escritura controlada a lead_memory)
     Métricas por etapa

 12. ✅ SISTEMA DE TAREAS ← Productividad del vendedor
     Tabla tasks (nueva)
     Tareas manuales + pendientes de followup

 13. 🔔 NOTIFICACIONES ← Engagement con la plataforma
     Leads calientes (score > 90)
     FollowUps pendientes
     Nuevos mensajes

 14. 🏆 DASHBOARD VENDEDOR ← Gamificación que retiene
     Mis métricas, ranking, actividad


SEMANA 7-8: COMPLETAR MVP
──────────────────────────
Prioridad: Lo necesario para que sea un producto completo

 15. ⚙️ CONFIGURACIÓN
     Perfil de empresa · Equipo · Invitaciones

 16. 🚀 ONBOARDING
     Wizard de primera vez · Empty states
     Tour guiado

 17. 📱 RESPONSIVE / PWA
     Optimización mobile
     Bottom navigation

 18. ✨ POLISH
     Animaciones · Microinteracciones
     Loading states · Error handling
     Performance optimization
```

### 6.2 Lo que el Cliente ve en la Demo (Semana 4)

```
"Mira cómo FAIREX analiza cada conversación de WhatsApp
 automáticamente con IA..."

     📈 Dashboard con KPIs en tiempo real
                    ↓
"...te dice exactamente quién está listo para comprar..."

     🔥 Lead caliente con score 96 brillando en el dashboard
                    ↓
"...y puedes ver toda la conversación con el análisis
 inteligente al lado..."

     💬 Centro de conversaciones con panel IA
                    ↓
"...tu pipeline se actualiza solo..."

     🔀 Kanban con leads moviéndose automáticamente
                    ↓
"...y si un prospecto deja de responder, FAIREX lo
 recupera automáticamente."

     ✅ FollowUp IA pendiente en tareas
```

> [!TIP]
> Estas 4 pantallas (Dashboard, Conversaciones, Leads, Pipeline) son suficientes para cerrar ventas. Todo lo demás es mejora iterativa post-lanzamiento.

---

## 7. PLAN DE EVOLUCIÓN PROGRESIVA

### 7.1 Fases de Evolución

```
FASE 0 — ACTUAL (HOY)
═══════════════════════════════════════════════════════════════

  Estado: Motor funcionando sin interfaz visual
  
  n8n ──► WhatsApp ──► AI ──► Supabase
  
  Limitación: Solo operable por el equipo técnico.
  No escalable a clientes externos.
  No tiene UI.


FASE 1 — MVP COMERCIAL (Semanas 1-8)
═══════════════════════════════════════════════════════════════

  AGREGAR: Frontend Next.js sobre infraestructura existente
  
  ┌─────────────┐
  │  Next.js    │ ← NUEVO
  │  Frontend   │
  └──────┬──────┘
         │ Lee de
         ▼
  ┌─────────────┐     ┌─────────────┐
  │  Supabase   │◄────│    n8n      │ ← SIN CAMBIOS
  │  (existente │     │ (existente) │
  │  + 6 tablas │     └─────────────┘
  │    nuevas)  │
  └─────────────┘
  
  Resultado: Producto vendible. Un tenant. 4 roles.
  Multi-tenancy: Preparado en schema pero operando single-tenant.
  

FASE 2 — MULTI-TENANT + BILLING (Semanas 9-16)
═══════════════════════════════════════════════════════════════

  AGREGAR: Soporte real para múltiples empresas
  
  ┌─────────────┐
  │  Next.js    │
  │  Frontend   │
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐     ┌─────────────┐
  │  Supabase   │◄────│    n8n      │ ← MODIFICACIÓN MENOR:
  │  RLS activo │     │             │   n8n recibe company_id
  │  Multi-ten. │     │             │   del webhook de WhatsApp
  └─────────────┘     └─────────────┘   y lo propaga a las tablas.
  
  AGREGAR:
  • Billing (Stripe)
  • Onboarding mejorado
  • Calendario
  • Reportes básicos
  • Gamificación vendedores
  • Campos personalizados (JSONB en clientes)
  
  MODIFICAR n8n (mínimo):
  • Agregar company_id a los INSERT/UPDATE de n8n
    (1 campo nuevo en cada workflow de escritura)
  • No cambiar lógica de IA
  

FASE 3 — ESCALA (Semanas 17-32)
═══════════════════════════════════════════════════════════════

  AGREGAR: Canales adicionales + features avanzados
  
  • Facebook Messenger (nuevo workflow n8n)
  • Instagram DM (nuevo workflow n8n)
  • Telegram (nuevo workflow n8n)
  • Email (nuevo workflow n8n)
  • Webchat widget
  • Marketing Intelligence
  • Reportes avanzados
  • API pública v1
  • AI usage metering
  
  Cada nuevo canal = nuevo workflow en n8n,
  misma estructura que WhatsApp.
  

FASE 4 — ENTERPRISE (Semanas 33-52)
═══════════════════════════════════════════════════════════════

  • Director Comercial IA (nuevo workflow n8n con cron)
  • IA Comercial (Query Agent — nuevo endpoint)
  • Visual automation builder (si necesario, sobre n8n)
  • Mobile app nativa
  • SSO/SAML
  • White-label
  • Fine-tuned models
  

FASE 5 — PLATFORM (Año 2+)
═══════════════════════════════════════════════════════════════

  • Marketplace
  • Custom objects
  • AI Voice Agent
  • Data warehouse
  • Internacionalización
```

### 7.2 Cuándo Modificar n8n (y cuándo no)

```
FASE 1 (MVP): NO TOCAR n8n
─────────────────────────────
El frontend solo LEE de Supabase.
n8n sigue funcionando exactamente igual.
Cero riesgo.


FASE 2 (Multi-tenant): MODIFICACIÓN MÍNIMA en n8n
──────────────────────────────────────────────────
Cambio: Agregar 1 campo (company_id) a cada INSERT/UPDATE.
Impacto: Bajo. Es agregar un campo a queries existentes.
Riesgo: Bajo. Se puede hacer por tabla, probando una a una.

Cómo:
  Opción A (recomendada): Trigger en Supabase que asigna
    company_id automáticamente basándose en el número de
    WhatsApp → channel_line → company. n8n NO necesita cambiar.
    
  Opción B: Modificar workflows n8n para incluir company_id.
    Solo si Opción A no es viable.


FASE 3+: NUEVOS WORKFLOWS en n8n (no modificar existentes)
──────────────────────────────────────────────────────────
Cada nuevo canal (FB, IG, Telegram) = nuevo workflow.
Copia la estructura del workflow de WhatsApp.
No toca los workflows existentes.


NUNCA: Reescribir la lógica de IA fuera de n8n
───────────────────────────────────────────────
Los agentes IA corren en n8n. Funcionan.
Mover la IA al frontend o a Edge Functions
sería una reconstrucción sin beneficio.
```

---

## 8. FUNCIONALIDADES YA CUBIERTAS POR n8n

### 8.1 Mapa de Cobertura

| Funcionalidad del Doc Original | ¿Cubierta por n8n? | Acción Frontend |
|-------------------------------|:-------------------:|----------------|
| Recepción de mensajes WhatsApp | ✅ Sí | Solo mostrar en UI |
| Agente Analizador de Conversaciones | ✅ Sí | Mostrar resultados de `lead_memory` |
| Motor de Scoring | ✅ Sí | Mostrar `score_lead` de `lead_memory` |
| Agente de Pipeline | ✅ Sí | Mostrar `etapa_venta` en Kanban |
| FollowUp IA — programación | ✅ Sí | Mostrar `followup_pendiente` + `fecha_followup` |
| FollowUp IA — generación de mensajes | ✅ Sí | Mostrar en tareas/notificaciones |
| FollowUp IA — envío | ✅ Sí | No intervenir |
| FollowUp IA — control de intentos | ✅ Sí | Mostrar `intentos_followup` |
| Retargeting IA — programación | ✅ Sí | Mostrar `retargeting_pendiente` |
| Retargeting IA — generación | ✅ Sí | Mostrar en tareas |
| Retargeting IA — envío | ✅ Sí | No intervenir |
| Retargeting IA — control intentos | ✅ Sí | Mostrar `intentos_retargeting` |
| Memoria CRM (resumen, objeciones, etc.) | ✅ Sí | Mostrar datos de `lead_memory` |
| Escritura a Supabase | ✅ Sí | No duplicar |
| Hot Lead Detection (score > 90) | ⚠️ Parcial | Frontend crea alerta con query a `lead_memory` donde `score_lead > 90` |
| Director Comercial IA | ❌ No | Fase 2+: nuevo workflow n8n con cron |
| IA Comercial (Query Agent) | ❌ No | Fase 3+: nuevo endpoint con OpenAI |
| Notificaciones WhatsApp al vendedor | ⚠️ Parcial | Si n8n ya envía alertas por WA, mostrar en UI |
| Asignación round-robin | ⚠️ Parcial | Depende de si n8n tiene este workflow |

### 8.2 Lo que el Frontend AGREGA (que n8n no tiene)

```
VALOR AGREGADO DEL FRONTEND
────────────────────────────

1. VISIBILIDAD
   Los datos de lead_memory existen pero nadie los ve
   de forma visual. El frontend los convierte en dashboards,
   pipelines, y métricas accionables.

2. GESTIÓN HUMANA
   n8n automatiza, pero el humano necesita:
   • Asignar leads a vendedores
   • Crear tareas manuales
   • Ver ranking del equipo
   • Tomar decisiones basadas en los insights de IA

3. MULTI-USUARIO
   n8n es una herramienta técnica mono-usuario.
   El frontend permite que todo el equipo comercial
   acceda con roles diferenciados.

4. EXPERIENCIA DE PRODUCTO
   Sin frontend no hay producto vendible.
   El frontend convierte una automatización técnica
   en un producto SaaS comercializable.

5. CONTROL Y OVERRIDE
   El vendedor puede mover manualmente un lead,
   agregar notas, etiquetar, priorizar — cosas
   que la IA no puede decidir sola.
```

---

## 9. VERIFICACIÓN: CERO DUPLICACIÓN DE lead_memory

### 9.1 Checklist de No-Duplicación

```
✅ resumen_inteligente  → NO se crea campo equivalente en ninguna tabla nueva
✅ score_lead           → NO se crea campo equivalente. Se lee de lead_memory.
✅ etapa_venta          → NO se crea campo equivalente. Kanban lee de lead_memory.
✅ nivel_interes        → NO se crea campo equivalente.
✅ objeciones           → NO se crea campo equivalente.
✅ necesidades          → NO se crea campo equivalente.
✅ prioridad            → NO se crea campo equivalente.
✅ listo_cerrar         → NO se crea campo equivalente.
✅ followup_pendiente   → NO se crea campo equivalente.
✅ fecha_followup       → NO se crea campo equivalente.
✅ intentos_followup    → NO se crea campo equivalente.
✅ retargeting_pendiente→ NO se crea campo equivalente.
✅ fecha_retargeting    → NO se crea campo equivalente.
✅ intentos_retargeting → NO se crea campo equivalente.
✅ ultimo_retargeting   → NO se crea campo equivalente.
```

### 9.2 Cómo el Frontend accede a estos datos

```sql
-- El frontend SIEMPRE hace JOIN, nunca duplica:

-- Vista de leads (lista)
SELECT
  c.id, c.nombre, c.telefono, c.email,
  c.assigned_to, c.tags, c.valor_estimado,
  lm.score_lead, lm.etapa_venta, lm.prioridad,
  lm.listo_cerrar, lm.nivel_interes,
  lm.followup_pendiente, lm.fecha_followup
FROM clientes c
LEFT JOIN lead_memory lm ON c.id = lm.cliente_id  -- o la FK que exista
WHERE c.company_id = :company_id
ORDER BY lm.score_lead DESC;

-- Pipeline Kanban
SELECT
  c.id, c.nombre, c.assigned_to,
  lm.etapa_venta, lm.score_lead, lm.prioridad
FROM clientes c
LEFT JOIN lead_memory lm ON c.id = lm.cliente_id
WHERE c.company_id = :company_id
  AND lm.etapa_venta NOT IN ('cerrado', 'perdido')
ORDER BY lm.score_lead DESC;

-- Dashboard KPIs
SELECT
  COUNT(*) FILTER (WHERE lm.score_lead >= 90) AS leads_calientes,
  COUNT(*) FILTER (WHERE lm.followup_pendiente = true) AS followups_pendientes,
  COUNT(*) FILTER (WHERE lm.retargeting_pendiente = true) AS retargeting_pendientes,
  COUNT(*) FILTER (WHERE lm.etapa_venta = 'cerrado') AS cierres,
  AVG(lm.score_lead) AS score_promedio
FROM lead_memory lm
WHERE lm.company_id = :company_id;
```

> [!NOTE]
> Necesito conocer la relación exacta entre `clientes` y `lead_memory` (¿FK?, ¿campo compartido como teléfono?, ¿1:1 o 1:N?) para confirmar la estructura del JOIN. Si es por `telefono` o campo externo, se recomienda agregar un FK explícito (`lead_memory.cliente_id`) para optimizar queries.

---

## 10. REGLAS DE MIGRACIÓN SEGURA

### 10.1 Checklist de Seguridad Pre-Migración

```
ANTES de ejecutar cualquier migración SQL:

☐ Hacer backup completo de Supabase
☐ Verificar que n8n sigue insertando correctamente después de ALTER TABLE
☐ Probar cada ALTER TABLE en un ambiente de staging
☐ Verificar que ningún workflow de n8n falla por columna nueva
☐ Todas las columnas nuevas deben ser nullable o tener DEFAULT
☐ No renombrar columnas existentes
☐ No cambiar tipos de datos de columnas existentes
☐ No agregar NOT NULL a columnas existentes
☐ No eliminar columnas existentes
☐ Verificar que RLS no bloquea writes de n8n
    (n8n podría no pasar por Auth → usar service_role key)
```

### 10.2 Orden de Migración

```
PASO 1: Crear tablas nuevas (companies, company_members, etc.)
        Riesgo: CERO (no toca nada existente)

PASO 2: ALTER TABLE — agregar columnas a clientes
        Riesgo: BAJO (nullable, n8n no se afecta)
        Verificar: n8n inserta correctamente

PASO 3: ALTER TABLE — agregar columnas a lead_memory
        Riesgo: BAJO (nullable)
        Verificar: n8n inserta correctamente

PASO 4: ALTER TABLE — agregar columnas a conversaciones
        Riesgo: BAJO (nullable)

PASO 5: ALTER TABLE — agregar columnas a n8n_chat_history
        Riesgo: BAJO (nullable)

PASO 6: UPDATE masivo — llenar company_id en registros existentes
        Riesgo: BAJO (no cambia datos operativos)

PASO 7: Crear RLS policies (sin activar)
        Riesgo: CERO

PASO 8: Activar RLS
        Riesgo: MEDIO — verificar que n8n usa service_role key
        (service_role bypasses RLS en Supabase)

PASO 9: Crear índices para queries del frontend
        Riesgo: BAJO (solo performance)
```

### 10.3 Protección de n8n

```
CRÍTICO: n8n debe usar la clave service_role de Supabase,
no la clave anon.

La clave service_role IGNORA RLS policies.
Esto significa que n8n sigue escribiendo sin restricciones
mientras que el frontend (con clave anon + JWT) está
restringido por RLS.

Verificar: ¿Qué clave usa n8n actualmente para conectar a Supabase?
  • Si usa service_role → Perfecto, no hay cambio.
  • Si usa anon → Las RLS policies podrían bloquear a n8n.
    Solución: Cambiar a service_role en n8n.
```

---

## RESUMEN EJECUTIVO

### Errores del Documento Original (V1)

| Error | Corrección |
|-------|-----------|
| Proponía tabla `leads` | `clientes` ya existe. NO crear nueva tabla. |
| Proponía tabla `messages` | `n8n_chat_history` ya existe. NO duplicar. |
| Proponía nueva tabla `conversations` | `conversaciones` ya existe. Solo agregar columnas. |
| Proponía `ai_memory` como JSONB dentro de `leads` | `lead_memory` es tabla independiente. Respetar diseño. |
| Proponía 14+ tablas nuevas | Solo 6 tablas nuevas son necesarias para MVP. |
| Proponía reconstruir pipeline de IA | IA funciona en n8n. NO reconstruir. |
| Proponía mover IA a Edge Functions | n8n maneja la IA. Dejarlo ahí. |
| Asumía greenfield | Es evolución sobre producción existente. |

### Decisiones Arquitectónicas Finales

```
1. Frontend = Cabina de cristal sobre motor existente
2. n8n = Intocable en Fase 1, modificación mínima en Fase 2
3. lead_memory = Tabla sagrada. Frontend lee, no escribe (excepto etapa_venta manual)
4. Multi-tenancy = company_id en tablas existentes, RLS, service_role para n8n
5. 6 tablas nuevas para MVP (companies, company_members, user_profiles,
   tasks, notifications, company_settings)
6. ~18 columnas nuevas en 4 tablas existentes (todas nullable)
7. Build order = Auth → Dashboard → Conversaciones → Leads → Pipeline → Tareas
8. Primera demo vendible: Semana 4
9. MVP comercial completo: Semana 8
```

---

*Documento generado como CTO Enterprise — Auditoría de Compatibilidad V2*
