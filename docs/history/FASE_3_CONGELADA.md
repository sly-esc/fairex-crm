# Estado Lógico: FASE 3 CONGELADA (Multi-Tenant Groundwork)

## Estado Actual de la Arquitectura
El sistema FAIREX ha transicionado exitosamente de un modelo de inquilino único (V1.0.1) a una arquitectura base multiempresa (Fase 3), manteniendo total compatibilidad retroactiva.

### 1. Base de Datos (Supabase)
Todas las tablas operativas críticas ahora poseen la columna `company_id` con aislamiento estructural garantizado.

| Tabla | Estado de `company_id` | Llave Foránea (FK) | Restricciones | Backfill Histórico |
| :--- | :--- | :--- | :--- | :--- |
| `companies` | N/A (Llave Primaria `id`) | N/A | N/A | Empresa ID 1 creada |
| `profiles` / `users` | Creada (`int8`) | Apunta a `companies(id)` | `NOT NULL`, `DEFAULT 1` | Migrados a ID 1 |
| `lead_memory` | Creada (`int8`) | Apunta a `companies(id)` | `NOT NULL`, `DEFAULT 1` | Migrados a ID 1 |
| `n8n_chat_histories` | Creada (`int8`) | Apunta a `companies(id)` | `NOT NULL`, `DEFAULT 1` | Migrados a ID 1 |

*Nota Crítica:* Todas las llaves foráneas operan bajo `ON DELETE RESTRICT` para evitar pérdida de datos accidental en caso de manipulación manual.

### 2. Backend / Consultas (`queries.ts`)
La lógica de la aplicación ya inyecta automáticamente el aislamiento en todas las lecturas y escrituras.

*   `getUserCompanyId()`: Si la sesión o el perfil no indican empresa, retorna `1` por seguridad.
*   **Filtros Estrictos:** Toda consulta (e.g., `getLeadsData`, `getChatHistory`) posee obligatoriamente `.eq('company_id', companyId)`.

### 3. Resoluciones Específicas
*   **Dashboard y Leads:** Restaurados exitosamente. Los leads de la V1.0.1 son ahora visibles y atribuibles a la empresa 1.
*   **Conversaciones:** El parche quirúrgico en `n8n_chat_histories` resolvió la caída silenciosa del `eq('company_id', companyId)`. Al tener ahora los registros históricos el `company_id = 1`, la query devuelve los mensajes y el panel central renderiza el chat sin problemas.

## Cierre de Fase 3 y Preparación para Fase 4
El sistema está **congelado y estable**. La estructura backend (tablas y columnas) y la estructura frontend (queries con `companyId`) están alineadas al 100%.

**Próxima Fase (Fase 4): Row Level Security (RLS)**
*   La lógica actual funciona a nivel de aplicación (filtros en TypeScript).
*   En la Fase 4, activaremos políticas de RLS nativas en PostgreSQL para trasladar el aislamiento desde la aplicación directamente al motor de la base de datos, garantizando una arquitectura de seguridad "Zero Trust" entre inquilinos.
*   No se tocará el flujo lógico actual de N8N hasta no habilitar RLS.
