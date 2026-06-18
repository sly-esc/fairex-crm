# FAIREX BUILD PLAN V1

> **Objetivo:** Transición de la fase de arquitectura a la construcción del MVP comercial (Frontend) sin afectar el motor IA/n8n actual.

A continuación, se detalla el plan de construcción técnico definitivo basado en la Auditoría de Compatibilidad V2 y el Documento Maestro de Arquitectura.

## 1. Stack Tecnológico Definitivo

*   **Framework Core:** Next.js (App Router)
*   **Lenguaje:** TypeScript
*   **Estilos y UI:** Tailwind CSS + Shadcn/ui (Radix UI)
*   **Animaciones (Premium UI):** Framer Motion
*   **Backend for Frontend (BFF):** Next.js Server Actions & API Routes
*   **Base de Datos y Auth:** Supabase (PostgreSQL, Auth, Realtime)
*   **Manejo de Estado Global:** Zustand (ligero, ideal para la sesión y tenant activo)
*   **Validación de Datos:** Zod + React Hook Form
*   **Drag & Drop (Kanban):** `@hello-pangea/dnd` o `dnd-kit`

## 2. Estructura de Carpetas

Adoptaremos una arquitectura basada en **Feature Slices** dentro del App Router para mantener escalabilidad:

```text
src/
├── app/
│   ├── (auth)/                  # Rutas públicas (login, register)
│   ├── (dashboard)/             # Rutas protegidas
│   │   ├── dashboard/           # Dashboard Ejecutivo y Vendedor
│   │   ├── leads/               # Lista y detalle de Leads
│   │   ├── conversations/       # Centro de Conversaciones
│   │   ├── pipeline/            # Vista Kanban
│   │   ├── tasks/               # Gestión de Tareas
│   │   └── settings/            # Configuración de empresa/usuario
│   ├── api/                     # Endpoints y webhooks
│   └── layout.tsx               # Root layout (Providers)
├── components/
│   ├── ui/                      # Componentes base (Shadcn, botones, inputs)
│   ├── layout/                  # Sidebar, Header, Shell
│   └── features/                # Componentes complejos por dominio (ej. ChatBoard, LeadCard)
├── lib/
│   ├── supabase/                # Clientes Supabase (server, browser, middleware)
│   └── utils/                   # Funciones utilitarias (formatters, cn)
├── hooks/                       # Custom hooks (ej. useRealtimeChat)
├── store/                       # Zustand stores (ej. useTenantStore)
└── types/                       # Interfaces TypeScript compartidas (Database generated)
```

## 3. Arquitectura Frontend

*   **Rendimiento y SEO:** Uso de **React Server Components (RSC)** en Next.js para carga inicial ultrarrápida de Leads, Dashboard y Pipeline.
*   **Interactividad:** **Client Components** reservados únicamente para UI interactiva (Kanban drag-and-drop, Inbox en tiempo real, Formularios).
*   **Tiempo Real:** Implementación de **Supabase Realtime** para la pantalla de Conversaciones (nuevos mensajes) y Notificaciones de leads calientes.
*   **Diseño Premium (Glassmorphism):** Se implementarán temas oscuros (Dark Mode) por defecto usando variables CSS en Tailwind, con degradados sutiles y efectos de desenfoque (`backdrop-blur`).
*   **Seguridad:** Toda la mutación de datos desde el frontend se hará a través de **Server Actions**, permitiendo validación en el servidor antes de tocar Supabase.

## 4. Arquitectura Dashboard

*   **Separación de Lecturas (CQRS Ligero):** El dashboard **no escribirá datos**. Leerá la información agregando cruces (`JOINs` o vistas materializadas) entre `lead_memory`, `clientes`, y `conversaciones`.
*   **Carga Asíncrona (Streaming):** Usaremos `<Suspense>` de React para cargar tarjetas individuales de KPIs sin bloquear la carga de toda la página.
*   **Métricas en Tiempo Real:** El "Briefing IA Diario" y la alerta de Leads Calientes (`score_lead > 90`) se mantendrán suscritos a cambios en la DB vía Supabase Realtime para actualizar la pantalla sin recargar.

## 5. Arquitectura Multiempresa

*   **Base de Datos:** Se crearán las tablas `companies` y `company_members`.
*   **Retrocompatibilidad:** Se añadirá la columna `company_id` a `clientes`, `lead_memory`, `conversaciones`, y `n8n_chat_history`.
    > [!IMPORTANT]
    > **Estrategia inicial:** Esta columna tendrá un valor `DEFAULT` apuntando a la empresa raíz, o permitirá valores `NULL`, garantizando que **los flujos actuales de n8n no fallen ni requieran modificaciones.**
*   **Seguridad (RLS):** Supabase Row Level Security garantizará que las queries desde el cliente o servidor automáticamente filtren `company_id == auth.users.tenant_id`.
*   **Middleware:** Un middleware en Next.js interceptará la sesión, verificará la empresa activa del usuario y protegerá las rutas.

## 6. Roadmap Técnico de Construcción

> Basado en la prioridad de generación de Revenue (Semanas 1 a 8).

*   **Semana 1-2 (Cimientos):**
    *   Setup de Next.js, Tailwind, Supabase Auth.
    *   Configuración de DB: Migraciones de tablas nuevas (`companies`, `company_members`, `user_profiles`, `tasks`, `notifications`) y `ALTER TABLE` a existentes (columnas nullable).
    *   Design System base, variables CSS y Root Layout (Sidebar).
*   **Semana 3-4 (El Producto que Vende - DEMOS):**
    *   Construcción del **Dashboard Ejecutivo** (Métricas base).
    *   Construcción del **Centro de Conversaciones** (Inbox Realtime y Panel Lateral de IA).
    *   Construcción del módulo **Leads y Detalle**.
*   **Semana 5-6 (Profundidad Comercial):**
    *   Desarrollo de **Pipeline (Kanban)** visual e interactivo.
    *   Sistema de Tareas y Notificaciones.
    *   Dashboard específico para el Vendedor (Gamificación).
*   **Semana 7-8 (Completar MVP):**
    *   Módulo de Configuración (Perfil, Equipo).
    *   Optimización Mobile Responsive / PWA.
    *   Polish final: Animaciones Framer Motion, manejo de errores y estados de carga.

## 7. Orden Exacto de Desarrollo de Pantallas

1.  **Auth (Login/Registro)** — Bloqueo de acceso.
2.  **App Shell (Layout)** — Sidebar, Topbar, navegación base.
3.  **Dashboard Ejecutivo** — Interfaz visual "Wow" de bienvenida (lectura pasiva).
4.  **Centro de Conversaciones** — Interfaz principal del usuario (Inbox + Chat Realtime).
5.  **Lista de Leads y Detalle de Lead** — Base de datos humana del CRM.
6.  **Pipeline (Kanban View)** — Arrastrar tarjetas según la `etapa_venta`.
7.  **Panel de Tareas** — Tareas manuales y sugeridas.
8.  **Panel de Notificaciones** — Centro de alertas (Slide-over o Dropdown).
9.  **Configuración** — (Empresa, Usuarios, Perfil).

## 8. Dependencias Recomendadas

> `package.json` clave:

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "tailwindcss": "^3.4",
    "framer-motion": "^11",
    "lucide-react": "latest",
    "zustand": "^4.5",
    "date-fns": "^3",
    "zod": "^3.22",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "@hello-pangea/dnd": "^12"
  }
}
```

## 9. Estrategia de Autenticación y Roles

*   **Autenticación:** Gestionada 100% por **Supabase Auth** (email/password).
*   **Asignación de Roles:** Centralizada en la tabla `company_members` (columna `role`: `owner`, `director`, `supervisor`, `vendedor`).
*   **Control de Acceso:**
    *   *Edge:* Next.js Middleware valida sesión activa.
    *   *Server:* Server Actions verifican los roles (ej. un "vendedor" no puede eliminar un lead o acceder a configuración global).
    *   *Client:* Renderizado condicional de la UI (ej. botón "Configuración" oculto para vendedores).
    *   *Database:* Políticas RLS en Supabase aseguran los datos en el nivel más bajo (ej. un vendedor solo puede hacer SELECT en leads donde `assigned_to = auth.uid()`).

## 10. Estrategia para Integrar Supabase SIN romper compatibilidad

> [!CAUTION]
> Estas son las **Reglas de Oro** que regirán el desarrollo para garantizar que el actual motor IA/n8n siga operando sin interrupción.

1.  **Cero Escritura en Campos de Inteligencia Artificial:**
    *   El Frontend Next.js **JAMÁS** escribirá, actualizará o borrará los campos analíticos en `lead_memory` (ej. `resumen_inteligente`, `score_lead`, `objeciones`, `necesidades`). Estos son propiedad exclusiva de n8n y la IA.
2.  **Cero Escritura de Mensajes Raw:**
    *   El Frontend **JAMÁS** insertará en `n8n_chat_history`. Su rol aquí es estrictamente de LECTURA.
3.  **Permisos de Escritura Operativa (Gestión Humana):**
    *   El Frontend **SÍ** puede mutar campos operativos de la gestión comercial en las tablas principales: `clientes.assigned_to`, `clientes.tags`, `conversaciones.status`, `conversaciones.unread_count`.
4.  **Movimiento de Pipeline Controlado:**
    *   La única excepción de escritura a `lead_memory` permitida al Frontend es el campo `etapa_venta` (desde el Kanban), asumiendo que la IA puede auto-ajustarlo posteriormente en un nuevo análisis.
5.  **Migración Pasiva de Tenancy:**
    *   Cualquier columna nueva añadida a las tablas *core* (como `company_id`) será introducida como **`NULLABLE` o con un valor por defecto**, evitando que los flujos actuales de inserción de n8n (que no conocen la existencia de este ID) fallen al guardar un nuevo registro.
