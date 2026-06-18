# CHANGELOG — FAIREX AI BUSINESS OS

---

## v1.0.1 — Official Freeze & Bugfix
**Fecha de congelamiento oficial:** 14 Jun 2026  
**Estado:** ✅ V1.0.1 lista para producción — Sistema CRM Single-Player sin mocks

---

### FASE 2.4.1 — Congelamiento Final V1.0.1
**Archivos modificados:** `PROJECT_STATUS.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, `FAIREX_SYSTEM_BIBLE.md`

- **Sincronización documental:** Declaración oficial del cierre de la Versión 1.0.1, confirmando la estabilidad del sistema, corrección de bugs críticos de sesión y limpieza de mocks.

---

### FASE 4 (Diseño) — Row Level Security (RLS)
**Estado:** ⏳ En fase de auditoría y diseño arquitectónico.

- **Diseño "Zero Trust":** Las políticas nativas de PostgreSQL se encargarán de filtrar estrictamente por `company_id`.
- **Tablas objetivo:** `profiles`, `lead_memory`, `n8n_chat_histories`.
- **Ejecución Pendiente:** Restringido a diseño, sin modificar SQL de producción.

---

### FASE 3 — Arquitectura Multiempresa (Multi-Tenant Groundwork)
**Estado:** ✅ Ejecutada y congelada en producción  
**Archivos preparados:** `src/lib/services/queries.ts`, `docs/migration_phase_3_consolidation.sql`

- **Script SQL consolidado ejecutado:** La base de datos fue saneada e idempotizada con `migration_phase_3_consolidation.sql` (renombramiento de `users` a `profiles`, backfill seguro a `company_id = 1`, protección con `ON DELETE RESTRICT`).
- **N8N integrado nativamente:** Las conversaciones cargan dinámicamente con `getChatHistory` solucionando caídas silenciosas causadas por columnas faltantes.
- **Aislamiento en aplicación completado:** Todas las consultas en `queries.ts` operan bajo el filtro estricto de `companyId` recuperado de la sesión o con un fallback de seguridad a `1`.

---

### FASE 2.3.2 — Corrección de Bug de Logout (Bucle de Sesión)
**Archivos modificados:** `src/components/layout/TopHeader.tsx`

- **Logout real implementado:** Se corrigió un error crítico donde el botón de "Cerrar sesión" solo redirigía a `/login` pero no destruía las cookies del navegador ni avisaba a Supabase.
- **Evitado falso rebote:** Se ejecutó `supabase.auth.signOut()` de manera asíncrona usando el cliente de navegador, lo que permite al middleware de Next.js detectar la ausencia de sesión y permitir el acceso a la pantalla de login sin ser redirigido forzosamente al dashboard.

---

### FASE 2.3.1 — Purga Final y Mejoras de UX
**Archivos modificados:** `src/lib/store.ts`, `src/lib/services/queries.ts`

- **Purga de LocalStorage:** Clave de Zustand persist cambiada de `fairex-business-os-storage` a `fairex-v1-storage`. Elimina definitivamente los datos fantasma (tareas y alertas ficticias) que habían quedado cacheados en navegadores de sesiones anteriores.
- **Fecha y hora completa en "Último Contacto":** Se actualizó el formateador de `timeStr` en `queries.ts` para incluir día, mes y año junto con la hora (`14 jun 2026 · 09:46`), enriqueciendo la columna del Directorio de Leads sin nuevas consultas a Supabase.

---

### FASE 2.3 — QA y Limpieza Final de la V1
**Archivos modificados:** `leads/[id]/page.tsx`, `leads/page.tsx`, `dashboard/page.tsx`

- **Eliminación de `MOCK_DB`:** El Perfil CRM del lead (`/leads/[id]`) dejó de usar la base de datos estática falsa. Ahora obtiene datos reales desde `pipelineLeads` y `conversations` en Zustand.
- **EmptyState en Historial:** Las tarjetas de "Historial de Actividad", "Necesidades" y "Objeciones" muestran EmptyState elegante cuando el lead no tiene esos datos disponibles en memoria.
- **Lead no encontrado:** Se implementó un EmptyState de pantalla completa si el ID de la URL no corresponde a ningún lead activo.
- **Audit Completo:** Grep profundo confirmó cero instancias de datos ficticios en `/src`.

---

### FASE 2.2 — Migración Completa del Dashboard
**Archivos modificados:** `dashboard/page.tsx`, `store.ts`

- **Briefing IA dinámico:** Los textos del Briefing Diario de IA calculan en tiempo real los nuevos leads (etapa "Nuevo") y leads con score ≥ 90 desde `pipelineLeads` en Zustand.
- **Top Leads Calientes:** Reemplazó los 3 leads estáticos por un listado dinámico ordenado por score descendente.
- **KPIs del Dashboard:** Eliminados los 4 valores hardcodeados; ahora muestran Conversaciones Totales, Leads Activos, Conversaciones IA e Intervención Humana — todos derivados de Zustand.
- **Gráfica "Distribución de Leads":** Reemplazó la gráfica `revenueData` (ficticia, financiera) por una visualización real de leads agrupados por etapa de pipeline.
- **Store limpio:** `INITIAL_NOTIFICATIONS = []` e `INITIAL_TASKS = []` — EmptyState activos.

---

### FASE 2.1 — Integración con Supabase
**Archivos principales:** `queries.ts`, `DataProvider.tsx`, `store.ts`, `conversaciones/page.tsx`

- **Login real con Supabase Auth:** Sistema de autenticación completamente funcional con middleware de protección de rutas.
- **DataProvider:** Componente de inyección que en el arranque de la aplicación consulta `lead_memory` y `n8n_chat_histories`, transforma los datos, y los inyecta en el store de Zustand.
- **`queries.ts` (Server Actions):** Capa exclusiva de comunicación con Supabase. Contiene `getLeadsData`, `getChatHistory`, `getLeadMemory` y `updateLeadEstado`.
- **Conversaciones conectadas:** El chat IA ahora carga el historial real desde `n8n_chat_histories` vía `session_id` = número del lead.
- **Lead Memory conectado:** El panel derecho de Conversaciones obtiene score, etapa, resumen, necesidades y objeciones directamente desde `lead_memory`.
- **Excluir / Reactivar lead:** Operación real — hace UPDATE en `lead_memory.estado` y sincroniza Zustand.
- **Etapas normalizadas:** La función `normalizeStage` en `queries.ts` convierte valores legacy como `contacto_inicial` a la representación canónica `Nuevo`.
- **Perfil de usuario:** El TopHeader obtiene el nombre desde `user.user_metadata.name` o `user.email` como fallback.

---

### FASE 1 — MVP Frontend & UI
*(Completada previamente — Ver historial de commits)*

- Arquitectura Next.js App Router con Tailwind v4 y Shadcn UI.
- Zustand con persistencia en localStorage y guard de hidratación `_hasHydrated`.
- Branding White-Label dinámico con ThemeProvider y `color-mix()`.
- Pipeline Kanban con Drag & Drop (dnd-kit).
- Framer Motion para micro-animaciones.
- Responsive con Sheet/Drawer para móvil.
- Corrección de Hydration Mismatches, crashes de Dropdown y contraste de Branding.


## Resumen Ejecutivo de Documentación
**Estado del Sistema (Checkout Técnico):** ESTABLE.
Cualquier desarrollador o agente IA que retome este proyecto encontrará una arquitectura frontend Next.js + Tailwind v4 100% finalizada a nivel UI/UX para un MVP. No hay bloqueadores, errores de hidratación, ni fallos visuales. Toda la data se persiste en el `localStorage` mediante `Zustand` como puente simulador del backend. El branding se inyecta dinámicamente y la configuración técnica (Prompts de IA) ha sido enmascarada exitosamente bajo una presentación Enterprise visual.

---

### Versión Actual (Cierre Fase 1 MVP)

**1. Corrección de Error de Hidratación en Pipeline**
* **Error:** `In HTML, <button> cannot be a descendant of <button>`.
* **Solución:** Limpieza estructural en los DropdownMenuTrigger (Filtros de Leads/Pipeline), eliminando el uso de `Button` nativo anidado y dejándolos como componentes limpios.

**2. Corrección de Crash de Base UI en Dropdowns**
* **Error:** `MenuGroupContext is missing`.
* **Solución:** Refactorización de `DropdownMenuLabel` en `src/components/ui/dropdown-menu.tsx` retirando su dependencia forzada a un primitivo de grupo no declarado, y reemplazándolo por un simple `<div />` estético con validación de accesibilidad.

**3. Restauración de Contraste Visual en Interfaz (Branding Dinámico)**
* **Error:** Al aplicar Branding personalizados, los botones con fondos "primary" y texto oscuro perdían visibilidad.
* **Solución:** Asignación puntual de la clase utilitaria `text-white` en elementos críticos (`Guardar Cambios`, Botón `Chatear`, Badges de `Notificaciones` y `Conversaciones`), blindando su legibilidad independiente de la tonalidad elegida.

**4. Estabilización de Persistencia de Estado Global y Supervivencia (F5)**
* **Error:** El estado modificado (notificaciones leídas, tareas, movimientos del pipeline) desaparecía tras recargar el navegador.
* **Solución:**
  * Reestructuración del store `partialize` de Zustand para incluir `pipelineLeads`, `tasks`, `branding`, `notifications`, `conversations`, `activeConversationId`.
  * Introducción estricta de barrera de hidratación `_hasHydrated` con soporte global para bloquear renderizado inicial prematuro SSR y evitar fallos de colisión.
* **Archivos Modificados:** `src/lib/store.ts`, `src/app/(dashboard)/tasks/page.tsx`, `pipeline/page.tsx`, `conversaciones/page.tsx`, `notifications/page.tsx`.

**5. Compatibilidad Absoluta con Tailwind v4 y Modos de Fusión (Glow Effects)**
* **Error:** Al migrar el `ThemeProvider` de RGB/HSL fragmentado a inyecciones completas HEX para el `branding`, los efectos estéticos manuales como `rgba(var(--primary), 0.3)` dejaron de ser soportados por CSS, rompiendo los glows de la UI.
* **Solución:** Modernización de todo el motor de resplandor (glow/shadows). Se eliminaron múltiples llamadas estáticas de rgba en favor de la función estándar moderna `color-mix(in_srgb,var(--primary)_X0%,transparent)`.
* **Archivos Modificados:** `src/components/layout/ThemeProvider.tsx`, `src/app/(dashboard)/tasks/page.tsx`, `src/components/ui/empty-state.tsx`, `dashboard/page.tsx`, `leads/[id]/page.tsx`, `conversaciones/page.tsx`, `AppSidebar.tsx`.

**6. Experiencia Minimalista y Enterprise de Configuración AI**
* **Solicitud:** Simplificación de la pestaña "Ajustes IA" ocultando Prompts y controles avanzados de comportamiento para los clientes finales.
* **Solución:** Inyección de una tarjeta estática bloqueada por FAIREX, con información de contacto orientativa. El sistema de variables del System Prompt se ha dejado intacto en la arquitectura para desarrollos futuros.
* **Archivos Modificados:** `src/app/(dashboard)/settings/page.tsx`.
