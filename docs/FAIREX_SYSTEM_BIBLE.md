# FAIREX SYSTEM BIBLE

Esta es la fuente oficial de verdad y la constitución técnica del proyecto FAIREX AI BUSINESS OS. Este documento establece las directrices inquebrantables de arquitectura, base de datos, seguridad y escalabilidad que rigen todo el desarrollo presente y futuro. Debe mantenerse sincronizado con `ARCHITECTURE.md`, `PROJECT_STATUS.md` y `CHANGELOG.md`.

---

## 1. Filosofía del proyecto

* **Nunca romper producción.** La estabilidad es innegociable.
* **Toda migración debe ser aditiva.** No se deben eliminar columnas, alterar tipos de datos que causen pérdida de información, ni realizar cambios destructivos en tablas activas.
* **Respaldar antes de cualquier cambio importante.** Todo paso estructural en base de datos requiere una comprobación de respaldo.
* **Mantener compatibilidad con N8N.** El puente de comunicación IA-Backend es la columna vertebral operativa.
* **El sistema debe ser escalable y multiempresa.** El diseño asume una arquitectura SaaS Tenant-based desde el primer día.

---

## 2. Arquitectura general

El flujo de información obedece la siguiente cadena de responsabilidades estricta:

```
WhatsApp
   ↓
  N8N (Orquestación de IA y automatización)
   ↓
lead_memory (Tabla principal de ingesta)
   ↓
Supabase (Backend, Auth, Database)
   ↓
Dashboard (Frontend Next.js App Router)
   ↓
 Vercel (Hosting, Edge Network)
   ↓
Clientes (Interacción B2B/B2C)
```

---

## 3. Tabla principal

### `lead_memory`
Es el núcleo del sistema y la **única tabla alimentada directamente por N8N**.

N8N tiene permisos exclusivos de escritura sobre:
* `lead_memory` (Contexto, variables extraídas y estado del lead).
* `n8n_chat_histories` (El transcript crudo de la conversación entre el lead y la IA).

*Ningún otro componente del sistema (incluyendo el Dashboard) debe realizar escrituras directas destructivas sobre estas tablas que puedan corromper el hilo lógico de la IA.*

---

## 4. Tablas secundarias

Las tablas de gestión operativa son alimentadas y modificadas principalmente por el Dashboard (usuarios humanos u operaciones internas):

* `companies`: Gestión multi-tenant, branding y facturación. **`company_id` activo.**
* `profiles` (ex-`users`): Agentes, supervisores y administradores. **Renombrado y blindado en FASE 3.**
* `tasks`: Seguimientos, recordatorios manuales y acciones operativas.
* `alerts`: Notificaciones internas generadas por el sistema.

---

## 5. Convenciones técnicas

* **Todo el sistema utiliza `int8` (BigInt) para IDs.**
* **No usar UUID.** Por razones de rendimiento, compatibilidad heredada y simplicidad transaccional, se emplea `int8` como llave primaria y foránea.
* **No modificar IDs históricos.** Un ID asignado es inmutable.
* **Mantener compatibilidad con las tablas existentes.** Cualquier extensión de características requiere añadir columnas (aditivo), no alterar tipos.
* **No eliminar columnas antiguas.** Las columnas depreciadas se abandonan o documentan, pero no se eliminan para prevenir rupturas en integraciones externas o reportes.

---

## 6. Reglas críticas

* **Nunca alterar `n8n_chat_histories`.** Es la memoria inmutable de la IA.
* **Nunca romper `lead_memory`.** El agente depende absolutamente de este estado para responder coherentemente.
* **No exponer Service Role Key.** La clave `service_role` de Supabase es sagrada.
* **El Service Role solo puede existir en el backend.** No debe ser referenciado, empaquetado, ni utilizado bajo ninguna circunstancia en código del lado del cliente (`/components`, hooks de Zustand, etc.).
* **Toda nueva funcionalidad debe ser extensible.** Diseñar los módulos asumiendo que eventualmente tendrán que soportar configuraciones personalizadas por cada `company_id`.

---

## 7. Seguridad

* **GitHub Privado:** Todo el código fuente está bajo propiedad intelectual y control de acceso estricto.
* **Variables de entorno (`.env`):** Nunca incluir credenciales reales en repositorios o historial de Git.
* **Backups frecuentes:** Point-in-Time Recovery habilitado en Supabase.
* **RLS en Supabase:** El *Row Level Security* es obligatorio. Toda tabla debe validar `auth.uid()` o aislar por `company_id`.
* **Logs y auditoría:** Mantener visibilidad sobre fallos de autenticación y webhooks de N8N.
* **Roles de usuario:** Diferenciación estricta entre Administrador del Tenant y Agente Base.
* **Protección contra borrados accidentales:** Soft deletes preferidos (`deleted_at` timestamp) sobre eliminación en cascada (`DELETE`), excepto donde sea técnicamente imperativo.

---

## 8. Roadmap

- [x] **FASE 1:** Dashboard local con mocks (Completada).
- [x] **FASE 2.1:** Integración real con Supabase — Leads, Conversaciones, Auth (Completada).
- [x] **FASE 2.2:** Migración completa del Dashboard — Eliminación de todos los mocks de UI (Completada).
- [x] **FASE 2.3:** QA y limpieza final — Perfil CRM dinámico, Audit completo (Completada).
- [x] **FASE 2.3.1:** Purga de persistencia, fecha completa en Último Contacto (Completada).
- [x] **FASE 2.3.2:** Corrección de bug de Logout nativo con Supabase (Completada).
- [x] **FASE 2.4.1:** Congelamiento Oficial V1.0.1 (Completada).
- [x] **FASE 3:** Arquitectura Multi-Tenant ejecutada en producción. Backfill completo. FK con `ON DELETE RESTRICT`. `company_id` activo en `profiles`, `lead_memory` y `n8n_chat_histories`. **Verificada y congelada.**
- [⏳] **FASE 4:** RLS y Seguridad — Row Level Security en Supabase por tenant. **En diseño y auditoría.**
- [ ] **FASE 5:** GitHub + Vercel — CI/CD y deployment automatizado.
- [ ] **FASE 6:** Dominio — DNS y SSL en producción.
- [ ] **FASE 7:** Clientes reales — Onboarding comercial activo.

---

## 9. Principios para IA y desarrolladores

1. Antes de modificar una tabla, **verificar la compatibilidad** con integraciones previas (N8N y Zustand).
2. **Nunca realizar cambios destructivos.** Si hay duda, optar por adición.
3. Priorizar siempre la **estabilidad sobre la velocidad** de desarrollo.
4. Mantener estricta **separación de responsabilidades** entre N8N (procesamiento AI/Autopiloto) y el Dashboard (visualización y control manual).
5. Pensar siempre en la **escalabilidad SaaS**; cada query, acción y mutación debe contemplar inherentemente a qué cliente (`company_id`) pertenece.

---

## 10. Estado Actual del Proyecto

**✅ V1.0.1 PRODUCTION READY + FASE 3 MULTIEMPRESA COMPLETADA**

El sistema es un CRM Multi-Tenant completamente conectado a Supabase, sin datos ficticios, con aislamiento lógico por `company_id` activo en todas las tablas críticas.

> ⏳ **FASE 4 en auditoría (diseño):** Se está diseñando Row Level Security (RLS) nativo en PostgreSQL para las tablas `profiles`, `lead_memory` y `n8n_chat_histories`. Sin ejecución en producción hasta aprobación del diseño.

**Tablas activas en Supabase (FASE 3 completada):**
- `companies` — Tabla maestra de tenants. `id=1` activo.
- `profiles` (ex-`users`) — Usuarios con `company_id NOT NULL DEFAULT 1`, FK a `companies`.
- `lead_memory` — Fuente principal de leads, scores, etapas y resúmenes. `company_id` activo.
- `n8n_chat_histories` — Historial inmutable de conversaciones IA-Lead. `company_id` activo.
- `auth.users` — Gestión de sesión y perfil del usuario autenticado.

**Módulos conectados a datos reales:**
- Dashboard (KPIs, Briefing, Top Leads, Distribución de Leads)
- Directorio de Leads (con fecha y hora de Último Contacto)
- Pipeline Kanban (Drag & Drop + Excluir/Reactivar)
- Perfil CRM del Lead `/leads/[id]`
- Conversaciones (chat IA en tiempo real desde `n8n_chat_histories`)
- Lead Memory (panel derecho en Conversaciones)

**Módulos en EmptyState (pendientes de fases futuras):**
- Tasks — UI lista, sin tabla Supabase aún.
- Notifications/Alertas — UI lista, sin tabla Supabase aún.

**Flujo de datos confirmado y congelado:**
```
Supabase → queries.ts → DataProvider → Zustand → UI
```

*Siguiente acción oficial: **FASE 4** — Row Level Security (RLS) en Supabase por tenant.*

---

## 11. Reglas de Producción

* Nunca eliminar tablas existentes.
* Nunca eliminar columnas históricas.
* Toda modificación deberá ser aditiva.
* Siempre realizar respaldos antes de cambios estructurales.
* No romper compatibilidad con N8N.
* El Dashboard no debe alterar la lógica interna de la IA.

---

## 12. Reglas de Seguridad

* Nunca exponer la Service Role Key.
* La Service Role Key solo puede existir del lado servidor.
* Las variables sensibles siempre deberán permanecer en `.env`.
* GitHub permanecerá privado.
* En producción deberán existir RLS y aislamiento por `company_id`.

---

## 13. Reglas para Agentes de IA y Desarrolladores

* Nunca realizar cambios destructivos.
* Priorizar estabilidad sobre velocidad.
* Verificar compatibilidad con tablas existentes antes de modificar algo.
* No cambiar `int8` por UUID.
* Mantener separación entre Frontend, Supabase y N8N.
* Pensar siempre en escalabilidad SaaS.

---

## 14. Estrategia de Evolución

La tabla principal seguirá siendo `lead_memory`.

N8N únicamente escribirá:
* `lead_memory`
* `n8n_chat_histories`

El resto del sistema crecerá mediante nuevas tablas y módulos, evitando modificar la arquitectura central.

El objetivo es permitir que FAIREX evolucione durante años sin comprometer la estabilidad del núcleo actual.
