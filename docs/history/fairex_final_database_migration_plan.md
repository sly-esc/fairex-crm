# FAIREX FINAL DATABASE MIGRATION PLAN

> **Objetivo:** Presentar el plan de migración SQL exacto y la justificación arquitectónica para revisión final, garantizando cero roturas en los flujos operativos de n8n. **NO se ejecutará nada sin autorización explícita.**

---

## 1. SQL Exacto que se Ejecutará

```sql
-- ============================================================================
-- 1. CREACIÓN DE TABLAS NUEVAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  industry          TEXT,
  plan              TEXT DEFAULT 'starter',
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL DEFAULT 'vendedor',
  is_active         BOOLEAN DEFAULT true,
  joined_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  avatar_url        TEXT,
  phone             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  assigned_to       UUID REFERENCES company_members(id),
  lead_id           UUID,
  status            TEXT DEFAULT 'pending',
  priority          TEXT DEFAULT 'medium',
  due_date          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES company_members(id) ON DELETE CASCADE,
  type              TEXT NOT NULL,
  title             TEXT NOT NULL,
  body              TEXT,
  data              JSONB,
  is_read           BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  ai_config         JSONB DEFAULT '{"tone": "profesional", "auto_response": true}',
  pipeline_stages   JSONB DEFAULT '["interesado", "seguimiento", "caliente", "cerrado", "perdido"]',
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. MODIFICACIÓN A TABLAS EXISTENTES (ALTER TABLE)
-- NOTA CRÍTICA: Todas las columnas nuevas NO TIENEN restricción "NOT NULL"
-- ============================================================================

-- Tabla: clientes
ALTER TABLE clientes 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES company_members(id),
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS valor_estimado DECIMAL(12,2);

-- Tabla: conversaciones
ALTER TABLE conversaciones 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES company_members(id),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Tabla: lead_memory
ALTER TABLE lead_memory 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Tabla: n8n_chat_history
ALTER TABLE n8n_chat_history 
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id),
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
```

---

## 2. Tablas Nuevas que se Crearán
1. `companies`
2. `company_members`
3. `user_profiles`
4. `tasks`
5. `notifications`
6. `company_settings`

---

## 3. Columnas Nuevas que se Agregarán
*(Ver sección 2 del SQL para el detalle exacto. Todas son nulas por defecto).*

---

## 4. Impacto sobre Tablas Existentes

| Tabla Existente | Impacto Arquitectónico | ¿Modifica el Frontend datos previos? | ¿Rompe inserciones de n8n? |
| :--- | :--- | :--- | :--- |
| **`clientes`** | Bajo. Solo recibe columnas para asignación humana (tags, vendedor). | Sí, el frontend edita tags y `assigned_to`. | **NO.** n8n seguirá creando clientes igual que hoy. Las columnas nuevas quedarán nulas. |
| **`conversaciones`** | Bajo. Solo recibe un tracking de estados y conteo visual. | Sí, el frontend marca como 'closed' o 'pending'. | **NO.** n8n seguirá creando conversaciones sin error. |
| **`lead_memory`** | Mínimo. Solo se inyecta el `company_id` para filtrar inquilinos en la base de datos. | **NO** (excepto `etapa_venta`). El frontend lee, no reescribe la IA. | **NO.** n8n es el único que llena los datos inteligentes. |
| **`n8n_chat_history`** | Mínimo. Solo se añade tracking visual (`is_read`). | Sí, solo modifica `is_read = true` al abrir un chat. | **NO.** n8n inserta mensajes raw de forma intacta. |

---

## 5. Justificación de Cada Tabla Nueva

*   **`companies`**: Necesaria como "nodo raíz" para poder agrupar datos de distintos clientes B2B. Es el corazón del SaaS.
*   **`company_members`**: Necesaria porque Supabase Auth (`auth.users`) solo guarda el email. Necesitamos saber si el email "juan@ventas.com" es *Owner*, *Supervisor* o *Vendedor* en la empresa X.
*   **`user_profiles`**: Necesaria para guardar el nombre, la foto y el teléfono del usuario (datos que `auth.users` no gestiona de forma relacional).
*   **`tasks`**: Necesaria para que los vendedores puedan agendar llamadas, cotizaciones y recordatorios sin ensuciar la memoria de la IA de `lead_memory`.
*   **`notifications`**: Necesaria para que el frontend pueda pintar la "campanita" roja con notificaciones cuando la IA de n8n califica a un lead con score > 90.
*   **`company_settings`**: Necesaria para guardar los colores, etapas de pipeline personalizadas y configuraciones de cada empresa sin añadir 50 columnas a la tabla `companies`.

---

## 6. Por Qué `companies` y `company_members` son Necesarias

FAIREX pasará de ser un "sistema de uso interno" a un **B2B SaaS (Software as a Service)**.
Si entra la Inmobiliaria A y la Clínica Médica B a usar FAIREX:
1.  Sin `companies`, los leads de la Inmobiliaria se mezclarían con los leads de la Clínica.
2.  Sin `company_members`, el Vendedor de la Clínica B podría ver y robar los leads de la Inmobiliaria A.

Estas dos tablas crean **Silos de Datos** estancos.

---

## 7. Estrategia Exacta Multiempresa (Multi-tenant)

1.  **Columna Universal:** Toda tabla (leads, chats, memorias) tendrá la columna `company_id`.
2.  **Aislamiento Físico (RLS):** Se crearán Políticas de Seguridad por Filas (Row Level Security) en Supabase.
3.  **Mecanismo:** Cuando Juan intenta leer `clientes`, la base de datos ejecuta silenciosamente: *"Devuelve los clientes donde `company_id` sea igual al `company_id` de Juan según su registro en `company_members`"*.
4.  **Si no hay match, no hay datos.** Esto es invulnerable en el Backend, incluso si el Frontend tiene un bug de renderizado.

---

## 8. Confirmación de Cero Roturas a n8n

> [!IMPORTANT]  
> **CONFIRMADO: NINGÚN WORKFLOW DE n8n SE ROMPERÁ.**

**Razón Técnica:** 
En bases de datos SQL, si agregas una columna nueva a una tabla y NO le pones la regla `NOT NULL`, la base de datos la marca como `NULL` automáticamente si alguien (como n8n) no la incluye en su instrucción de `INSERT`.
Como n8n seguirá haciendo `INSERT INTO clientes (nombre, telefono) VALUES ('Juan', '555')`, PostgreSQL lo aceptará e insertará `NULL` en `company_id`. FAIREX funcionará sin problemas.

---

## 9. Riesgos Identificados y Mitigación

> [!WARNING]
> **Riesgo 1: Datos Huérfanos en MVP (El problema del NULL)**
> Si n8n inserta un nuevo lead hoy en Producción, el `company_id` será `NULL`. El frontend Multiempresa no se lo mostrará a nadie, porque no pertenece a ninguna empresa.
> 
> *Mitigación Inmediata:*
> Durante el MVP, agregaremos un `DEFAULT 'id-de-la-empresa-principal'` temporalmente en el `ALTER TABLE` a la columna `company_id`, o configuraremos un *Trigger* en PostgreSQL para que, si un insert llega sin `company_id`, se asigne a la empresa raíz automáticamente. 

> [!WARNING]
> **Riesgo 2: Escalabilidad de n8n a Múltiples Empresas**
> A futuro, si conectamos 5 números de WhatsApp de 5 empresas distintas al mismo Webhook de n8n, n8n no sabrá a qué empresa pertenece el mensaje.
>
> *Mitigación a Futuro (Fase 2):* 
> Modificar levemente el primer nodo de n8n para que, dependiendo del número de WhatsApp receptor, identifique el `company_id` y lo pase en las inserciones SQL. (Para el MVP actual de 1 sola empresa, este riesgo no aplica).
