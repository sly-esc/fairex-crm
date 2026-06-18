# FAIREX AI BUSINESS OS — Master Architecture Document

> **Versión:** 1.0  
> **Fecha:** 2026-06-01  
> **Perspectiva:** CTO Enterprise · Product Manager · Arquitecto SaaS · Arquitecto IA · UX Architect

---

## ÍNDICE

1. [Arquitectura Completa del Producto](#1-arquitectura-completa-del-producto)
2. [Módulos Principales](#2-módulos-principales)
3. [Sitemap Completo](#3-sitemap-completo)
4. [Navegación del Sistema](#4-navegación-del-sistema)
5. [Flujo de Usuarios](#5-flujo-de-usuarios)
6. [Wireframes Textuales](#6-wireframes-textuales)
7. [Arquitectura Multiempresa](#7-arquitectura-multiempresa)
8. [Arquitectura de Permisos y Roles](#8-arquitectura-de-permisos-y-roles)
9. [Arquitectura de IA](#9-arquitectura-de-ia)
10. [Arquitectura de Automatizaciones](#10-arquitectura-de-automatizaciones)
11. [Riesgos Técnicos](#11-riesgos-técnicos)
12. [Oportunidades de Escalabilidad](#12-oportunidades-de-escalabilidad)
13. [Roadmap de Producto a 24 Meses](#13-roadmap-de-producto-a-24-meses)
14. [Gap Analysis vs Competidores Enterprise](#14-gap-analysis-vs-competidores-enterprise)

---

## 1. ARQUITECTURA COMPLETA DEL PRODUCTO

### 1.1 Diagrama de Capas Arquitectónicas

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CAPA 1 — PRESENTACIÓN                          │
│  Next.js App Router · React · Tailwind CSS · Framer Motion         │
│  PWA · Responsive · Dark Mode · Glassmorphism                      │
├─────────────────────────────────────────────────────────────────────┤
│                     CAPA 2 — GATEWAY / BFF                         │
│  Next.js API Routes (Backend for Frontend)                         │
│  Rate Limiting · Request Validation · Session Management           │
│  Middleware de Tenant Resolution · CORS · CSP                      │
├─────────────────────────────────────────────────────────────────────┤
│                     CAPA 3 — SERVICIOS DE NEGOCIO                  │
│  Supabase Edge Functions (Deno Runtime)                            │
│  CRM Engine · Pipeline Engine · Scoring Engine                     │
│  Notification Service · Task Engine · Calendar Engine              │
│  Billing Service · Reporting Engine                                │
├─────────────────────────────────────────────────────────────────────┤
│                     CAPA 4 — CAPA DE INTELIGENCIA ARTIFICIAL       │
│  Orquestador de Agentes IA                                        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐          │
│  │Analyzer  │Scoring   │FollowUp  │Retarget  │Director  │          │
│  │Agent     │Agent     │Agent     │Agent     │Agent     │          │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┤          │
│  │HotLead   │Query     │Pipeline  │                     │          │
│  │Detector  │Agent     │Agent     │  (Extensible)       │          │
│  └──────────┴──────────┴──────────┴─────────────────────┘          │
│  OpenAI API · Prompt Management · Context Window Manager           │
│  Guardrails · Token Budget · Response Cache                        │
├─────────────────────────────────────────────────────────────────────┤
│                     CAPA 5 — INTEGRACIÓN Y AUTOMATIZACIÓN          │
│  n8n (Self-hosted)                                                 │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ WhatsApp Business API  · Meta Graph API              │          │
│  │ Telegram Bot API · SMTP/IMAP · Webchat WebSocket     │          │
│  │ Webhook Router · Event Bus · Queue Manager           │          │
│  └──────────────────────────────────────────────────────┘          │
├─────────────────────────────────────────────────────────────────────┤
│                     CAPA 6 — DATOS Y PERSISTENCIA                  │
│  PostgreSQL (Supabase)                                             │
│  Row Level Security · Multi-tenant Isolation                       │
│  Supabase Realtime (WebSocket subscriptions)                       │
│  Supabase Storage (archivos, media, documentos)                    │
│  Supabase Auth (JWT + MFA)                                         │
├─────────────────────────────────────────────────────────────────────┤
│                     CAPA 7 — INFRAESTRUCTURA                       │
│  Vercel (Frontend) · Supabase Cloud (Backend)                      │
│  n8n Cloud o Self-hosted (Docker)                                  │
│  CDN · SSL · DNS · Monitoring · Logging                            │
│  CI/CD Pipeline · Staging/Production Environments                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Datos Global

```
CANALES EXTERNOS                 PLATAFORMA FAIREX                    SALIDAS
─────────────────   ─────────────────────────────────────   ─────────────────

WhatsApp ──┐                                                  ┌── Dashboards
Messenger ─┤        ┌─────────┐    ┌─────────────┐           ├── Alertas
Instagram ─┼──────▶ │  n8n    │───▶│ Agente IA   │           ├── Notificaciones
Telegram ──┤        │ Router  │    │ Principal   │           ├── Reportes
Email ─────┤        └─────────┘    └──────┬──────┘           ├── Tareas Auto
Webchat ───┘                              │                   ├── FollowUps
                                          ▼                   ├── Retargeting
                                   ┌─────────────┐           └── Respuestas Auto
                                   │ Memoria CRM │
                                   │ Inteligente  │
                                   └──────┬──────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │      Supabase         │
                              │  PostgreSQL + RLS     │
                              │  Realtime + Storage   │
                              │  Auth + Edge Fns      │
                              └───────────┬───────────┘
                                          │
                              ┌───────────┴───────────┐
                              │   Motor Comercial IA  │
                              │   Scoring · Pipeline  │
                              │   Insights · Forecast │
                              └───────────────────────┘
```

### 1.3 Patrones Arquitectónicos Adoptados

| Patrón | Aplicación | Justificación |
|--------|-----------|---------------|
| **Multi-tenant Row-Level** | Toda la plataforma | Supabase RLS nativo, costo-eficiente, escalable |
| **Event-Driven** | Automatizaciones, IA | Desacoplamiento entre canales, procesamiento y respuesta |
| **BFF (Backend for Frontend)** | Next.js API Routes | Proteger claves API, validar sesión, transformar datos |
| **Agent Orchestration** | Capa IA | Cada agente IA tiene responsabilidad única, composables |
| **CQRS Ligero** | Dashboards vs. Operaciones | Queries de lectura optimizadas separadas de escrituras |
| **Observer/Pub-Sub** | Supabase Realtime | Actualización en tiempo real de conversaciones, alertas |
| **Strategy Pattern** | Scoring Engine | Diferentes algoritmos de scoring por industria/empresa |

---

## 2. MÓDULOS PRINCIPALES

### 2.1 Mapa de Módulos

```
FAIREX AI BUSINESS OS
│
├── 🔐 M01 — Autenticación y Onboarding
│   ├── Login / Registro
│   ├── MFA
│   ├── Recuperación de contraseña
│   ├── Wizard de onboarding
│   └── Invitación de equipo
│
├── 🏢 M02 — Gestión Multiempresa (Tenancy)
│   ├── Crear/editar empresa
│   ├── Configuración de empresa
│   ├── Branding por empresa
│   └── Límites por plan
│
├── 👥 M03 — Gestión de Usuarios y Roles
│   ├── CRUD usuarios
│   ├── Asignación de roles
│   ├── Permisos granulares
│   ├── Equipos/grupos
│   └── Actividad de usuario
│
├── 📇 M04 — CRM Core
│   ├── Leads (CRUD, importar, exportar)
│   ├── Contactos
│   ├── Empresas cliente
│   ├── Campos personalizados
│   ├── Etiquetas y segmentos
│   ├── Historial de actividad
│   └── Notas internas
│
├── 💬 M05 — Centro de Conversaciones
│   ├── Inbox unificado
│   ├── Chat en tiempo real
│   ├── Panel de análisis IA
│   ├── Asignación de conversaciones
│   ├── Respuestas rápidas / templates
│   ├── Media (imágenes, audio, documentos)
│   └── Estado: abierta / cerrada / pendiente
│
├── 🧠 M06 — Motor de Inteligencia Artificial
│   ├── Agente Analizador de Conversaciones
│   ├── Agente de Scoring
│   ├── Agente de Pipeline
│   ├── Agente FollowUp
│   ├── Agente Retargeting
│   ├── Agente Hot Lead Detector
│   ├── Agente Director Comercial
│   ├── Agente de Consultas (Query Agent)
│   ├── Prompt Manager
│   ├── Context Window Manager
│   └── AI Usage Metering
│
├── 📊 M07 — Pipeline Inteligente
│   ├── Vista Kanban
│   ├── Vista lista
│   ├── Configuración de etapas
│   ├── Movimiento automático IA
│   ├── Filtros y ordenamiento
│   └── Métricas por etapa
│
├── 🔔 M08 — Sistema de Alertas y Notificaciones
│   ├── Alertas in-app (real-time)
│   ├── Notificaciones push (PWA)
│   ├── Notificaciones WhatsApp
│   ├── Notificaciones email
│   ├── Centro de notificaciones
│   └── Preferencias de notificación
│
├── 📈 M09 — Dashboard Ejecutivo
│   ├── KPIs en tiempo real
│   ├── Gráficas de tendencia
│   ├── Resumen IA diario
│   ├── Alertas críticas
│   ├── Vista de período (hoy/semana/mes/trimestre)
│   └── Comparativas temporales
│
├── 🏆 M10 — Dashboard de Vendedores
│   ├── Métricas individuales
│   ├── Ranking de equipo
│   ├── Metas vs. logros
│   ├── Gamificación (insignias, rachas)
│   ├── Actividad reciente
│   └── Tareas pendientes
│
├── 📅 M11 — Calendario Inteligente
│   ├── Vistas mes/semana/día
│   ├── Eventos manuales
│   ├── Eventos auto-generados IA
│   ├── Sincronización externa (Google/Outlook)
│   ├── Disponibilidad
│   └── Recordatorios automáticos
│
├── ✅ M12 — Sistema de Tareas IA
│   ├── Tareas manuales
│   ├── Tareas auto-generadas
│   ├── Asignación y priorización
│   ├── Fechas límite y recordatorios
│   ├── Detección de retrasos
│   └── Vista tablero / lista
│
├── 📊 M13 — Reportes y Analytics
│   ├── Reportes de ventas
│   ├── Reportes de equipo
│   ├── Reportes de canales
│   ├── Reportes de IA
│   ├── Exportación (PDF, CSV, Excel)
│   └── Reportes personalizados (futuro)
│
├── 📣 M14 — Marketing Intelligence
│   ├── Conexión Meta Ads
│   ├── Conexión Google Ads
│   ├── Conexión TikTok Ads
│   ├── Métricas: CPL, CPA, ROAS, ROI
│   ├── Atribución de leads por fuente
│   └── Análisis de campañas
│
├── 🔗 M15 — Integraciones y Canales
│   ├── WhatsApp Business (multi-línea)
│   ├── Facebook Messenger
│   ├── Instagram DM
│   ├── Telegram
│   ├── Email
│   ├── Webchat embeddable
│   └── Webhooks / API
│
├── ⚡ M16 — Motor de Automatizaciones
│   ├── Workflows n8n pre-construidos
│   ├── Triggers basados en eventos
│   ├── Acciones automáticas
│   ├── Logs de ejecución
│   └── Constructos visual (futuro)
│
├── 💳 M17 — Billing y Suscripciones
│   ├── Planes (Starter, Pro, Enterprise)
│   ├── Gestión de suscripción
│   ├── Historial de pagos
│   ├── Facturación
│   ├── Límites por plan
│   └── Upgrade/Downgrade
│
└── ⚙️ M18 — Configuración General
    ├── Perfil de empresa
    ├── Personalización (logo, colores)
    ├── Configuración de IA
    ├── Configuración de scoring
    ├── Configuración de pipeline
    ├── Configuración de notificaciones
    ├── API Keys
    ├── Seguridad
    └── Auditoría (activity log)
```

### 2.2 Matriz de Dependencias entre Módulos

```
         M01  M02  M03  M04  M05  M06  M07  M08  M09  M10  M11  M12  M13  M14  M15  M16  M17  M18
M01 Auth  ─    ●    ●    ○    ○    ○    ○    ○    ○    ○    ○    ○    ○    ○    ○    ○    ○    ○
M02 Tenant●    ─    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●
M03 Users ●    ●    ─    ●    ●    ○    ○    ●    ○    ●    ●    ●    ○    ○    ○    ○    ○    ●
M04 CRM   ○    ●    ●    ─    ●    ●    ●    ●    ●    ●    ●    ●    ●    ●    ○    ●    ○    ○
M05 Conv  ○    ●    ●    ●    ─    ●    ○    ●    ○    ○    ○    ○    ○    ○    ●    ●    ○    ○
M06 AI    ○    ●    ○    ●    ●    ─    ●    ●    ●    ○    ●    ●    ●    ○    ○    ●    ○    ●
M07 Pipe  ○    ●    ○    ●    ○    ●    ─    ●    ●    ●    ○    ○    ●    ○    ○    ●    ○    ●
M15 Chan  ○    ●    ○    ○    ●    ○    ○    ●    ○    ○    ○    ○    ○    ○    ─    ●    ○    ●

● = Dependencia fuerte    ○ = Sin dependencia o débil
```

### 2.3 Orden de Construcción (Topológico)

```
FASE 0 ─▶ M01 (Auth) + M02 (Tenancy)
FASE 1 ─▶ M03 (Users/Roles) + M18 (Config)
FASE 2 ─▶ M04 (CRM Core) + M15 (Canales — WhatsApp primero)
FASE 3 ─▶ M05 (Conversaciones) + M08 (Notificaciones)
FASE 4 ─▶ M06 (IA Core) + M07 (Pipeline)
FASE 5 ─▶ M09 (Dashboard Exec) + M10 (Dashboard Vendedores) + M12 (Tareas)
FASE 6 ─▶ M11 (Calendario) + M16 (Automatizaciones)
FASE 7 ─▶ M13 (Reportes) + M17 (Billing)
FASE 8 ─▶ M14 (Marketing Intelligence)
```

---

## 3. SITEMAP COMPLETO

```
FAIREX AI BUSINESS OS — Sitemap v1.0
─────────────────────────────────────

📁 /auth
├── /auth/login
├── /auth/register
├── /auth/forgot-password
├── /auth/reset-password
├── /auth/verify-email
├── /auth/accept-invite/:token
└── /auth/mfa-setup

📁 /onboarding
├── /onboarding/company-profile
├── /onboarding/invite-team
├── /onboarding/connect-channels
├── /onboarding/import-data
├── /onboarding/configure-ai
└── /onboarding/tour

📁 /dashboard
├── /dashboard                          ← Executive Dashboard (default)
├── /dashboard/executive                ← Vista Director/Owner
├── /dashboard/sales                    ← Vista Vendedor individual
├── /dashboard/team                     ← Vista rendimiento equipo
└── /dashboard/ai-briefing              ← Resumen IA diario

📁 /leads
├── /leads                              ← Lista de leads (tabla + filtros)
├── /leads/kanban                       ← Vista Kanban del pipeline
├── /leads/:id                          ← Detalle de lead
├── /leads/:id/conversations            ← Conversaciones del lead
├── /leads/:id/timeline                 ← Timeline de actividad
├── /leads/:id/ai-analysis              ← Análisis IA del lead
├── /leads/import                       ← Importar leads (CSV/Excel)
├── /leads/export                       ← Exportar leads
└── /leads/segments                     ← Segmentos y etiquetas

📁 /conversations
├── /conversations                      ← Inbox unificado (todos)
├── /conversations/mine                 ← Mis conversaciones
├── /conversations/unassigned           ← Sin asignar
├── /conversations/team                 ← Equipo
├── /conversations/:id                  ← Vista de conversación individual
└── /conversations/settings             ← Templates, respuestas rápidas

📁 /pipeline
├── /pipeline                           ← Vista Kanban principal
├── /pipeline/analytics                 ← Métricas por etapa
└── /pipeline/settings                  ← Configurar etapas

📁 /contacts
├── /contacts                           ← Lista de contactos
├── /contacts/:id                       ← Detalle de contacto
└── /contacts/:id/leads                 ← Leads asociados

📁 /companies
├── /companies                          ← Lista de empresas cliente
├── /companies/:id                      ← Detalle de empresa cliente
└── /companies/:id/contacts             ← Contactos de la empresa

📁 /calendar
├── /calendar                           ← Vista calendario (mes por defecto)
├── /calendar/day                       ← Vista día
├── /calendar/week                      ← Vista semana
├── /calendar/availability              ← Configurar disponibilidad
└── /calendar/event/:id                 ← Detalle evento

📁 /tasks
├── /tasks                              ← Lista de tareas (tabla + board)
├── /tasks/board                        ← Vista tablero Kanban
├── /tasks/mine                         ← Mis tareas
├── /tasks/team                         ← Tareas del equipo
└── /tasks/:id                          ← Detalle de tarea

📁 /reports
├── /reports                            ← Vista general reportes
├── /reports/sales                      ← Reporte de ventas
├── /reports/team                       ← Reporte de equipo
├── /reports/channels                   ← Reporte por canal
├── /reports/pipeline                   ← Reporte de pipeline
├── /reports/ai-performance             ← Rendimiento de IA
├── /reports/followups                  ← Reporte de seguimientos
└── /reports/export/:id                 ← Exportar reporte

📁 /ai
├── /ai/assistant                       ← Chat con IA Comercial
├── /ai/director                        ← Director Comercial IA (briefing)
├── /ai/insights                        ← Insights automatizados
├── /ai/recommendations                 ← Recomendaciones de acción
└── /ai/history                         ← Historial de consultas IA

📁 /marketing
├── /marketing                          ← Vista general marketing
├── /marketing/campaigns                ← Campañas publicitarias
├── /marketing/sources                  ← Fuentes de leads
├── /marketing/attribution              ← Atribución
└── /marketing/roi                      ← ROI por campaña

📁 /settings
├── /settings                           ← Vista general configuración
├── /settings/company                   ← Perfil de empresa
├── /settings/team                      ← Gestión de equipo
├── /settings/roles                     ← Configuración de roles
├── /settings/channels
│   ├── /settings/channels/whatsapp     ← Config WhatsApp (multi-línea)
│   ├── /settings/channels/facebook     ← Config Facebook Messenger
│   ├── /settings/channels/instagram    ← Config Instagram DM
│   ├── /settings/channels/telegram     ← Config Telegram
│   ├── /settings/channels/email        ← Config Email
│   └── /settings/channels/webchat      ← Config Webchat
├── /settings/pipeline                  ← Configuración de pipeline
├── /settings/scoring                   ← Configuración de scoring
├── /settings/ai                        ← Configuración de IA
├── /settings/automations               ← Automatizaciones activas
├── /settings/notifications             ← Preferencias de notificación
├── /settings/custom-fields             ← Campos personalizados
├── /settings/integrations              ← Integraciones terceros
├── /settings/api                       ← API Keys y webhooks
├── /settings/security                  ← Seguridad (MFA, sesiones)
├── /settings/billing                   ← Facturación y plan
├── /settings/billing/plans             ← Comparar planes
├── /settings/billing/invoices          ← Historial facturas
└── /settings/audit-log                 ← Log de auditoría

📁 /admin (Solo Super Admin FAIREX)
├── /admin                              ← Dashboard plataforma
├── /admin/companies                    ← Gestión de empresas/tenants
├── /admin/companies/:id                ← Detalle empresa
├── /admin/users                        ← Usuarios globales
├── /admin/billing                      ← Facturación global
├── /admin/analytics                    ← Métricas de plataforma
├── /admin/ai-usage                     ← Consumo IA por empresa
├── /admin/system-health                ← Estado del sistema
└── /admin/feature-flags                ← Feature flags por plan
```

**Total: 87 rutas únicas**

---

## 4. NAVEGACIÓN DEL SISTEMA

### 4.1 Sidebar Principal (Navegación Primaria)

```
┌─────────────────────────────────┐
│  🟢 FAIREX AI BUSINESS OS      │
│  ─────────────────────────────  │
│  📊 Empresa: [Nombre Empresa]  │ ← Selector de empresa (si aplica)
│  ─────────────────────────────  │
│                                 │
│  PRINCIPAL                      │
│  ──────────                     │
│  📈  Dashboard                  │ ← Owner, Director, Supervisor, Vendedor
│  📇  Leads                     │ ← Todos los roles
│  💬  Conversaciones        (5) │ ← Todos (badge con pendientes)
│  🔀  Pipeline                  │ ← Owner, Director, Supervisor
│                                 │
│  GESTIÓN                        │
│  ──────                         │
│  📅  Calendario                │ ← Todos los roles
│  ✅  Tareas               (3) │ ← Todos (badge con pendientes)
│  👥  Contactos                 │ ← Todos los roles
│  🏢  Empresas                  │ ← Owner, Director
│                                 │
│  INTELIGENCIA                   │
│  ────────────                   │
│  🤖  IA Comercial              │ ← Owner, Director, Supervisor
│  📊  Reportes                  │ ← Owner, Director, Supervisor
│  📣  Marketing                 │ ← Owner, Director
│                                 │
│  ─────────────────────────────  │
│  ⚙️  Configuración             │ ← Owner, Director (limitado)
│  🔔  Notificaciones       (7) │ ← Todos
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👤 Juan Pérez           │   │ ← Avatar + nombre
│  │    Director Comercial   │   │ ← Rol
│  │    Empresa ABC          │   │ ← Empresa activa
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 4.2 Visibilidad por Rol

| Sección | Owner | Director | Supervisor | Vendedor |
|---------|:-----:|:--------:|:----------:|:--------:|
| Dashboard Ejecutivo | ✅ | ✅ | ✅ | ❌ |
| Dashboard Ventas | ✅ | ✅ | ✅ | ✅ (solo propio) |
| Leads | ✅ All | ✅ All | ✅ Equipo | ✅ Propios |
| Conversaciones | ✅ All | ✅ All | ✅ Equipo | ✅ Propias |
| Pipeline | ✅ | ✅ | ✅ | ❌ |
| Calendario | ✅ All | ✅ All | ✅ Equipo | ✅ Propio |
| Tareas | ✅ All | ✅ All | ✅ Equipo | ✅ Propias |
| Contactos | ✅ | ✅ | ✅ | ✅ (propios) |
| Empresas | ✅ | ✅ | ❌ | ❌ |
| IA Comercial | ✅ | ✅ | ✅ (limitado) | ❌ |
| Reportes | ✅ | ✅ | ✅ (equipo) | ❌ |
| Marketing | ✅ | ✅ | ❌ | ❌ |
| Configuración | ✅ Full | ✅ Parcial | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ |
| Admin FAIREX | Super Admin | ❌ | ❌ | ❌ |

### 4.3 Navegación Contextual

```
HEADER BAR (siempre visible)
┌──────────────────────────────────────────────────────────────────┐
│  🔍 Buscar leads, conversaciones, contactos...    🔔 (7)  👤   │
│  ← [Breadcrumb: Dashboard > Leads > Juan García]               │
└──────────────────────────────────────────────────────────────────┘

ACCIONES RÁPIDAS (Floating Action Button o Command Palette)
┌──────────────────────────┐
│  ⌘K  Command Palette     │
│  ── ── ── ── ── ── ── ─  │
│  + Nuevo Lead            │
│  + Nueva Conversación    │
│  + Nueva Tarea           │
│  + Nuevo Evento          │
│  🤖 Preguntar a IA      │
│  🔍 Buscar...           │
└──────────────────────────┘
```

### 4.4 Navegación Mobile

```
BOTTOM TAB BAR (5 items máximo)
┌──────────────────────────────────────────────┐
│  📈        💬        📇       ✅       ≡    │
│  Dashboard  Chat     Leads   Tareas   Más    │
└──────────────────────────────────────────────┘

El menú "Más" despliega:
  Pipeline · Calendario · Contactos · IA · Reportes · Config
```

---

## 5. FLUJO DE USUARIOS

### 5.1 Flujo de Onboarding (Owner — Primera Vez)

```
Registro
  │
  ▼
Verificar email
  │
  ▼
Crear perfil de empresa ──────────── Nombre, industria, tamaño, logo
  │
  ▼
Invitar equipo ────────────────────── Emails + roles
  │
  ▼
Conectar primer canal ─────────────── WhatsApp prioritario
  │
  ▼
Importar datos (opcional) ─────────── CSV de leads existentes
  │
  ▼
Configurar IA ─────────────────────── Tono, idioma, industria, servicios
  │
  ▼
Tour interactivo ──────────────────── Guía de funciones principales
  │
  ▼
Dashboard ejecutivo ───────────────── Estado vacío con CTAs claros
```

### 5.2 Flujo Diario del Vendedor

```
Login
  │
  ▼
Dashboard Personal ────────────── Metas del día, ranking, rachas
  │
  ├──▶ 🔔 Alertas prioritarias
  │    ├── Lead caliente (score > 90) ──▶ Ir a conversación
  │    ├── FollowUp pendiente ──────────▶ Ver lead + mensaje sugerido
  │    └── Tarea vencida ──────────────▶ Completar tarea
  │
  ├──▶ 💬 Inbox de conversaciones
  │    ├── Nuevos mensajes ──▶ Responder con asistencia IA
  │    ├── Conversaciones activas ──▶ Continuar
  │    └── Panel IA lateral ──▶ Score, etapa, sugerencias
  │
  ├──▶ 📇 Mis leads
  │    ├── Filtrar por etapa/score/prioridad
  │    ├── Actualizar información
  │    └── Mover en pipeline
  │
  ├──▶ ✅ Mis tareas
  │    ├── Pendientes hoy
  │    ├── Completar tareas
  │    └── Ver tareas auto-generadas IA
  │
  └──▶ 📅 Mi calendario
       ├── Citas del día
       ├── Recordatorios
       └── Próximos seguimientos
```

### 5.3 Flujo Diario del Director Comercial

```
Login
  │
  ▼
Dashboard Ejecutivo
  │
  ├──▶ 🤖 Briefing IA Diario
  │    ├── Resumen: leads nuevos, calientes, cerrados
  │    ├── Alertas: seguimientos vencidos, oportunidades en riesgo
  │    ├── Recomendaciones: acciones prioritarias
  │    └── Forecast: proyección del mes
  │
  ├──▶ 📊 KPIs en tiempo real
  │    ├── Leads nuevos vs. período anterior
  │    ├── Tasa de conversión
  │    ├── Ventas generadas
  │    ├── ROI
  │    └── Tiempo promedio de cierre
  │
  ├──▶ 🏆 Rendimiento del equipo
  │    ├── Ranking de vendedores
  │    ├── Actividad por vendedor
  │    ├── Leads asignados vs. cerrados
  │    └── Alertas de bajo rendimiento
  │
  ├──▶ 🔀 Pipeline
  │    ├── Distribución por etapa
  │    ├── Valor estimado por etapa
  │    ├── Velocidad del pipeline
  │    └── Cuellos de botella
  │
  ├──▶ 🤖 Consultar IA Comercial
  │    ├── "¿Quién tiene mayor probabilidad de compra?"
  │    ├── "¿Qué vendedor necesita coaching?"
  │    └── "¿Dónde estamos perdiendo oportunidades?"
  │
  └──▶ 📊 Reportes
       ├── Generar reporte semanal
       ├── Comparativas mensuales
       └── Exportar para junta directiva
```

### 5.4 Flujo de Captura y Procesamiento de Lead

```
Prospecto envía mensaje (WhatsApp/Messenger/Instagram/...)
  │
  ▼
n8n recibe webhook del canal
  │
  ▼
¿Lead existente?
  ├── SÍ ──▶ Asociar mensaje a conversación existente
  │          Actualizar memoria CRM
  │
  └── NO ──▶ Crear nuevo lead
             Crear nueva conversación
  │
  ▼
Agente Analizador IA procesa el mensaje
  │
  ├── Extraer: intención, necesidades, objeciones, sentimiento
  ├── Generar: resumen_inteligente
  ├── Calcular: score_lead (0-100)
  ├── Determinar: etapa_venta
  ├── Evaluar: nivel_interes, prioridad
  └── Decidir: listo_cerrar (boolean)
  │
  ▼
Actualizar memoria CRM en Supabase
  │
  ▼
¿Score > 90 o listo_cerrar = true?
  ├── SÍ ──▶ ALERTA LEAD CALIENTE
  │          ├── Notificación in-app (real-time)
  │          ├── Notificación WhatsApp al vendedor
  │          ├── Crear tarea urgente
  │          └── Priorizar en dashboard
  │
  └── NO ──▶ Asignar a vendedor (round-robin o reglas)
             Crear notificación estándar
  │
  ▼
Vendedor responde en Centro de Conversaciones
  │
  ▼
IA re-analiza cada intercambio ──▶ Actualizar score, etapa, memoria
  │
  ▼
¿Lead deja de responder?
  ├── SÍ ──▶ Timer de inactividad activa FollowUp IA
  │          ├── Generar mensaje personalizado
  │          ├── Programar envío (followup_pendiente = true)
  │          ├── Controlar intentos (max 3-5)
  │          │
  │          └── ¿Agotó intentos sin respuesta?
  │               └── SÍ ──▶ Activar Retargeting IA
  │                          ├── Período de enfriamiento (7-30 días)
  │                          ├── Nuevo ángulo comercial
  │                          ├── Mensaje de reactivación
  │                          └── ¿Responde?
  │                               ├── SÍ ──▶ Volver a Pipeline activo
  │                               └── NO ──▶ Archivar / Lead Perdido
  │
  └── NO ──▶ Continuar proceso normal de ventas
             Pipeline: Interesado → Seguimiento → Caliente → Cerrar
```

### 5.5 Flujo del Supervisor

```
Login
  │
  ▼
Dashboard de Equipo
  │
  ├──▶ Vista de rendimiento por vendedor
  │    ├── Actividad en tiempo real
  │    ├── Conversaciones activas
  │    ├── Leads sin atender
  │    └── Tiempos de respuesta
  │
  ├──▶ Gestión de tareas del equipo
  │    ├── Tareas pendientes
  │    ├── Tareas vencidas (alerta)
  │    └── Reasignar tareas
  │
  ├──▶ Monitoreo de conversaciones
  │    ├── Leer conversaciones del equipo
  │    ├── Identificar problemas
  │    └── Intervenir si necesario
  │
  └──▶ Reportes de equipo
       ├── Comparativa entre vendedores
       └── Métricas de eficiencia
```

---

## 6. WIREFRAMES TEXTUALES

### 6.1 Pantalla de Login

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                   ┌──────────────────────────┐                    │
│                   │                          │                    │
│                   │    🟢 FAIREX AI          │                    │
│                   │    BUSINESS OS           │                    │
│                   │                          │                    │
│                   │  ─────────────────────   │                    │
│                   │                          │                    │
│                   │  Email                   │                    │
│                   │  ┌────────────────────┐  │                    │
│                   │  │                    │  │                    │
│                   │  └────────────────────┘  │                    │
│                   │                          │                    │
│                   │  Contraseña              │                    │
│                   │  ┌────────────────────┐  │                    │
│                   │  │              👁️    │  │                    │
│                   │  └────────────────────┘  │                    │
│                   │                          │                    │
│                   │  □ Recordarme             │                    │
│                   │                          │                    │
│                   │  ┌────────────────────┐  │                    │
│                   │  │   Iniciar Sesión   │  │                    │
│                   │  └────────────────────┘  │                    │
│                   │                          │                    │
│                   │  ── o continuar con ──   │                    │
│                   │  [Google]  [Microsoft]   │                    │
│                   │                          │                    │
│                   │  ¿Olvidaste contraseña?  │                    │
│                   │  ¿No tienes cuenta?      │                    │
│                   │  → Crear cuenta          │                    │
│                   │                          │                    │
│                   └──────────────────────────┘                    │
│                                                                    │
│  Fondo: gradiente oscuro con partículas animadas                  │
│  Card: glassmorphism con blur                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 Onboarding Wizard

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  FAIREX AI BUSINESS OS                        Paso 1 de 6         │
│                                                                    │
│  ── ● ── ○ ── ○ ── ○ ── ○ ── ○ ──   (Progress bar)              │
│                                                                    │
│  ┌────────────────────────────────────────────────────┐           │
│  │                                                    │           │
│  │   🏢 Cuéntanos sobre tu empresa                   │           │
│  │                                                    │           │
│  │   Nombre de la empresa                            │           │
│  │   ┌──────────────────────────────────────┐        │           │
│  │   │                                      │        │           │
│  │   └──────────────────────────────────────┘        │           │
│  │                                                    │           │
│  │   Industria                                       │           │
│  │   ┌──────────────────────────────────────┐        │           │
│  │   │  Seleccionar...                  ▼   │        │           │
│  │   └──────────────────────────────────────┘        │           │
│  │   Opciones: Clínica / Inmobiliaria / Agencia /   │           │
│  │   Constructora / Seguros / Otra                   │           │
│  │                                                    │           │
│  │   Tamaño del equipo comercial                     │           │
│  │   [1-5] [6-15] [16-50] [50+]                     │           │
│  │                                                    │           │
│  │   País                                            │           │
│  │   ┌──────────────────────────────────────┐        │           │
│  │   │  México                          ▼   │        │           │
│  │   └──────────────────────────────────────┘        │           │
│  │                                                    │           │
│  │   Logo (opcional)                                 │           │
│  │   ┌────────┐                                      │           │
│  │   │  📤    │  Arrastra o haz clic                │           │
│  │   └────────┘                                      │           │
│  │                                                    │           │
│  │              [Anterior]    [▶ Siguiente]          │           │
│  └────────────────────────────────────────────────────┘           │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3 Dashboard Ejecutivo

```
┌─── SIDEBAR ───┬────────────────────────────────────────────────────┐
│               │  HEADER                                            │
│  FAIREX AI    │  Dashboard Ejecutivo    📅 Hoy ▼   🔍  🔔(3) 👤  │
│  ────────     │                                                    │
│  📈 Dashboard │  ┌─────────────────────────────────────────────┐  │
│  📇 Leads     │  │ 🤖 DIRECTOR IA — Briefing del día           │  │
│  💬 Conv.  (5)│  │                                             │  │
│  🔀 Pipeline  │  │ "Hoy tienes 3 leads calientes listos para  │  │
│  ────────     │  │  cerrar. Tu equipo tiene 12 followups       │  │
│  📅 Calendario│  │  pendientes. Recomiendo priorizar a María   │  │
│  ✅ Tareas (3)│  │  García (score 96) — lleva 2 días sin       │  │
│  👥 Contactos │  │  contacto."                                 │  │
│  ────────     │  │                                             │  │
│  🤖 IA       │  │  [Ver detalle] [Acciones sugeridas]         │  │
│  📊 Reportes  │  └─────────────────────────────────────────────┘  │
│  📣 Marketing │                                                    │
│  ────────     │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  ⚙️ Config    │  │ Leads    │ │ Leads    │ │ Conv.    │ │ Tasa ││
│               │  │ Nuevos   │ │ Calientes│ │ Activas  │ │Cierre││
│               │  │   47     │ │   3 🔥   │ │   28     │ │ 23%  ││
│               │  │ +12% ↑   │ │ +1 ↑     │ │ -3 ↓     │ │ +2%↑ ││
│  ┌──────┐    │  └──────────┘ └──────────┘ └──────────┘ └──────┘│
│  │👤 JP │    │                                                    │
│  │Dir.  │    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐│
│  │Com.  │    │  │ Ventas   │ │ ROI      │ │ Tiempo   │ │Follow││
│  └──────┘    │  │ Generadas│ │          │ │ Cierre   │ │ Ups  ││
│               │  │ $142,500 │ │ 340%     │ │ 8.5 días │ │  12  ││
│               │  │ +18% ↑   │ │ +25% ↑   │ │ -1.2d ↑  │ │ ⚠️   ││
│               │  └──────────┘ └──────────┘ └──────────┘ └──────┘│
│               │                                                    │
│               │  ┌─────────────────────┐ ┌─────────────────────┐  │
│               │  │ 📈 VENTAS x MES     │ │ 🔀 PIPELINE         │  │
│               │  │                     │ │                     │  │
│               │  │  ▐▌                 │ │ Contacto ████ 15   │  │
│               │  │  ▐▌  ▐▌            │ │ Interesado ██ 8    │  │
│               │  │  ▐▌  ▐▌  ▐▌        │ │ Seguimiento █ 5    │  │
│               │  │  ▐▌  ▐▌  ▐▌  ▐▌    │ │ Caliente ██ 7      │  │
│               │  │ Ene Feb Mar Abr     │ │ Cerrar ███ 3       │  │
│               │  └─────────────────────┘ └─────────────────────┘  │
│               │                                                    │
│               │  ┌─────────────────────┐ ┌─────────────────────┐  │
│               │  │ 🏆 RANKING EQUIPO   │ │ 🔥 LEADS CALIENTES  │  │
│               │  │                     │ │                     │  │
│               │  │ 1. Ana López  12/15 │ │ María García    96  │  │
│               │  │ 2. Carlos R.  10/15 │ │ Pedro Sánchez   93  │  │
│               │  │ 3. Diana M.   8/15 │ │ Laura Díaz      91  │  │
│               │  │ 4. Roberto P. 6/15 │ │                     │  │
│               │  │                     │ │  [Ver todos →]      │  │
│               │  └─────────────────────┘ └─────────────────────┘  │
└───────────────┴────────────────────────────────────────────────────┘
```

### 6.4 Centro de Conversaciones

```
┌── SIDEBAR ──┬── CONV LIST ──────┬── CHAT ─────────────┬── IA ──────┐
│             │                   │                     │            │
│  (nav)      │ 🔍 Buscar...     │ ┌─────────────────┐│ ANÁLISIS   │
│             │                   │ │ María García    ││ IA         │
│             │ [Todas][Mías]     │ │ WhatsApp · En   ││            │
│             │ [Sin asignar]     │ │ línea           ││ Score      │
│             │                   │ └─────────────────┘│ ████ 96 🔥 │
│             │ ┌───────────────┐ │                     │            │
│             │ │🔥 María García│ │ 10:30 AM            │ Etapa      │
│             │ │ "Me interesa  │ │ ┌─────────────┐    │ 🟢 Caliente│
│             │ │  el precio"   │ │ │ Hola, me     │    │            │
│             │ │ Score: 96     │ │ │ interesa     │    │ Prioridad  │
│             │ │ hace 5 min    │ │ │ conocer el   │    │ 🔴 URGENTE │
│             │ └───────────────┘ │ │ precio del   │    │            │
│             │ ┌───────────────┐ │ │ servicio     │    │ Interés    │
│             │ │ Pedro Sánchez │ │ │ premium.     │    │ ████ Alto  │
│             │ │ "Lo voy a    │ │ └─────────────┘    │            │
│             │ │  pensar"      │ │                     │ ────────── │
│             │ │ Score: 45     │ │ 10:32 AM      Tú ▶ │ NECESIDADES│
│             │ │ hace 1 hora   │ │    ┌─────────────┐ │ • Servicio │
│             │ └───────────────┘ │    │ ¡Hola María!│ │   premium  │
│             │ ┌───────────────┐ │    │ Con gusto   │ │ • Precio   │
│             │ │ Laura Díaz    │ │    │ te comparto │ │   compet.  │
│             │ │ "¿Tienen      │ │    │ la info...  │ │            │
│             │ │  sucursal?"   │ │    └─────────────┘ │ OBJECIONES │
│             │ │ Score: 72     │ │                     │ • Ninguna  │
│             │ │ hace 3 horas  │ │ 10:45 AM            │   detectada│
│             │ └───────────────┘ │ ┌─────────────┐    │            │
│             │ ┌───────────────┐ │ │ Perfecto,   │    │ ────────── │
│             │ │ Carlos Ruiz   │ │ │ ¿cuándo      │    │ PRÓXIMA    │
│             │ │ "Necesito     │ │ │ podemos      │    │ ACCIÓN     │
│             │ │  cotización"  │ │ │ agendar?     │    │ Enviar     │
│             │ │ Score: 68     │ │ └─────────────┘    │ cotización │
│             │ │ hace 5 horas  │ │                     │ y agendar  │
│             │ └───────────────┘ │                     │ llamada    │
│             │                   │ ─────────────────── │            │
│             │ ── ── ── ── ──   │                     │ ────────── │
│             │ Mostrando 4 de   │ ┌─────────────────┐ │ SUGERENCIA │
│             │ 28 conversaciones│ │ 📎 Escribe un   │ │ IA         │
│             │                   │ │ mensaje...      │ │ "Enviar    │
│             │                   │ │          📤 ▶   │ │ propuesta  │
│             │                   │ └─────────────────┘ │ hoy mismo" │
│             │                   │ [🤖 Sugerir resp.] │            │
└─────────────┴───────────────────┴─────────────────────┴────────────┘
```

### 6.5 Vista de Leads (Lista)

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Leads                    [+ Nuevo Lead] [⬇ Import] │
│  (nav)      │                                                      │
│             │  🔍 Buscar...    [Filtros ▼]  [Vista: ▦ Lista ▥ Kanban] │
│             │                                                      │
│             │  Filtros activos: Etapa: Todos · Score: >50          │
│             │                                                      │
│             │  ┌────┬──────────────┬────────┬───────┬──────┬─────┐│
│             │  │ ☐  │ Lead         │ Canal  │ Score │Etapa │Asig.││
│             │  ├────┼──────────────┼────────┼───────┼──────┼─────┤│
│             │  │ ☐  │🔥María García│ WhatsApp│ 96 🔥│Calien│ Ana ││
│             │  │    │ Interesada   │        │       │te    │     ││
│             │  │    │ en premium   │        │       │      │     ││
│             │  ├────┼──────────────┼────────┼───────┼──────┼─────┤│
│             │  │ ☐  │ Pedro Sánchez│ Messeng│  93   │Listo │Carlos│
│             │  │    │ Cotización   │ er     │       │Cerrar│     ││
│             │  │    │ enviada      │        │       │      │     ││
│             │  ├────┼──────────────┼────────┼───────┼──────┼─────┤│
│             │  │ ☐  │ Laura Díaz   │ Instagr│  72   │Inter.│Diana││
│             │  │    │ Preguntó por │ am     │       │      │     ││
│             │  │    │ sucursal     │        │       │      │     ││
│             │  ├────┼──────────────┼────────┼───────┼──────┼─────┤│
│             │  │ ☐  │ Carlos Ruiz  │ WhatsA.│  68   │Segui.│ Ana ││
│             │  │    │ Necesita     │        │       │      │     ││
│             │  │    │ cotización   │        │       │      │     ││
│             │  ├────┼──────────────┼────────┼───────┼──────┼─────┤│
│             │  │ ☐  │ Roberto Pérez│ Email  │  45   │Conta.│ --- ││
│             │  │    │ Primer       │        │       │      │     ││
│             │  │    │ contacto     │        │       │      │     ││
│             │  └────┴──────────────┴────────┴───────┴──────┴─────┘│
│             │                                                      │
│             │  Mostrando 5 de 47 leads     [◀ 1 2 3 4 5 ▶]       │
│             │                                                      │
│             │  Acciones masivas: [Asignar] [Etiquetar] [Exportar] │
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.6 Detalle de Lead

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  ← Leads / María García                   [⋯] Más  │
│  (nav)      │                                                      │
│             │  ┌───────────────────────┐  ┌────────────────────┐  │
│             │  │ 👤 María García       │  │ 🤖 ANÁLISIS IA     │  │
│             │  │                       │  │                    │  │
│             │  │ 📱 +52 55 1234 5678  │  │ Score: ████ 96 🔥 │  │
│             │  │ 📧 maria@email.com   │  │ Etapa: Caliente    │  │
│             │  │ 🏢 Clínica Dental    │  │ Prioridad: URGENTE │  │
│             │  │ 📍 CDMX              │  │ Listo cerrar: ✅   │  │
│             │  │                       │  │                    │  │
│             │  │ Canal: WhatsApp       │  │ ─────────────────  │  │
│             │  │ Asignado: Ana López   │  │ Resumen IA:       │  │
│             │  │ Creado: 28 May 2026   │  │ "Prospecto alta-  │  │
│             │  │                       │  │ mente interesada   │  │
│             │  │ Etiquetas:            │  │ en servicio        │  │
│             │  │ [Premium] [CDMX]     │  │ premium. Sin       │  │
│             │  │                       │  │ objeciones. Lista  │  │
│             │  │ [✏️ Editar] [💬 Chat] │  │ para cerrar."      │  │
│             │  └───────────────────────┘  │                    │  │
│             │                             │ Necesidades:       │  │
│             │  [Timeline] [Conversaciones]│ • Servicio premium │  │
│             │  [Tareas] [Notas] [Archivos]│ • Horario flexible │  │
│             │                             │                    │  │
│             │  TIMELINE                   │ Objeciones:        │  │
│             │  ───────────                │ • Ninguna          │  │
│             │                             │                    │  │
│             │  🟢 Hoy 10:45 AM           │ Última acción:     │  │
│             │  └ Mensaje: "¿cuándo       │ Solicitó agendar   │  │
│             │    podemos agendar?"        │                    │  │
│             │                             │ ─────────────────  │  │
│             │  🟢 Hoy 10:30 AM           │ ACCIONES           │  │
│             │  └ Mensaje: "Me interesa   │ RECOMENDADAS       │  │
│             │    el precio del servicio"  │                    │  │
│             │                             │ 1. Enviar          │  │
│             │  🔵 28 May 4:00 PM         │    cotización      │  │
│             │  └ IA: Score actualizado    │ 2. Agendar         │  │
│             │    45 → 72                  │    llamada hoy     │  │
│             │                             │ 3. Preparar        │  │
│             │  🟢 28 May 3:55 PM         │    propuesta       │  │
│             │  └ Primer contacto vía     │                    │  │
│             │    WhatsApp                 │ [Ejecutar acción]  │  │
│             │                             │                    │  │
└─────────────┴─────────────────────────────┴────────────────────────┘
```

### 6.7 Pipeline (Vista Kanban)

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Pipeline         [Filtros ▼]  [Vista: ▥ Kanban ▦ Lista] │
│  (nav)      │                                                      │
│             │  ┌──────────┬──────────┬──────────┬──────────┬──────┐│
│             │  │CONTACTO  │INTERESADO│SEGUIMIENT│CALIENTE  │LISTO ││
│             │  │INICIAL   │          │O         │          │CERRAR││
│             │  │  15      │   8      │   5      │   7      │  3   ││
│             │  │          │          │          │          │      ││
│             │  │┌────────┐│┌────────┐│┌────────┐│┌────────┐│┌────┐││
│             │  ││Roberto ││ │Laura  ││ │Carlos ││ │🔥María││ │Pedro│││
│             │  ││Pérez   ││ │Díaz   ││ │Ruiz   ││ │García ││ │Sánc│││
│             │  ││Score:45││ │Score:72││ │Score:68││ │Score:96││ │hez │││
│             │  ││📧 Email││ │📸 IG  ││ │📱 WA  ││ │📱 WA  ││ │📱  │││
│             │  │└────────┘│└────────┘│└────────┘│└────────┘│└────┘││
│             │  │┌────────┐│┌────────┐│┌────────┐│┌────────┐│┌────┐││
│             │  ││Andrea  ││ │Miguel ││ │Diana  ││ │Pablo  ││ │Luisa│││
│             │  ││Torres  ││ │López  ││ │Méndez ││ │Reyes  ││ │Vega│││
│             │  ││Score:32││ │Score:65││ │Score:61││ │Score:88││ │92  │││
│             │  ││💬 FB   ││ │📱 WA  ││ │📱 WA  ││ │📧 Mail││ │📱  │││
│             │  │└────────┘│└────────┘│└────────┘│└────────┘│└────┘││
│             │  │┌────────┐│┌────────┐│          │┌────────┐│      ││
│             │  ││Sofía   ││ │José   ││          ││Fernanda││      ││
│             │  ││Ramírez ││ │Herrera││          ││Cruz    ││      ││
│             │  ││Score:28││ │Score:58││          ││Score:85││      ││
│             │  ││📱 TG   ││ │💬 FB  ││          ││📱 WA   ││      ││
│             │  │└────────┘│└────────┘│          │└────────┘│      ││
│             │  │  ...     │          │          │          │      ││
│             │  │ +12 más  │          │          │          │      ││
│             │  └──────────┴──────────┴──────────┴──────────┴──────┘│
│             │                                                      │
│             │  Drag & Drop para mover leads entre etapas           │
│             │  (IA sugiere movimientos automáticos)                │
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.8 Dashboard de Vendedor

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Mi Dashboard                      Buenos días, Ana 👋│
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────┐    │
│             │  │  🎯 META DEL MES: 15 cierres                │    │
│             │  │  ████████████░░░░░░░░  12/15 (80%)          │    │
│             │  │  "¡Vas excelente! 3 leads calientes pueden  │    │
│             │  │   ayudarte a alcanzar tu meta esta semana."  │    │
│             │  └──────────────────────────────────────────────┘    │
│             │                                                      │
│             │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│             │  │ Mis Leads│ │ Cierres  │ │ Conv.    │ │ Racha    ││
│             │  │   23     │ │   12     │ │   8      │ │ 🔥 5 días││
│             │  │ activos  │ │ este mes │ │ activas  │ │ seguidos ││
│             │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│             │                                                      │
│             │  ┌──────────────────────┐ ┌─────────────────────────┐│
│             │  │ 🔔 ACCIONES HOY     │ │ 🏆 RANKING SEMANAL      ││
│             │  │                      │ │                         ││
│             │  │ 🔥 Lead caliente     │ │  🥇 Ana López    — Tú  ││
│             │  │ María García (96)    │ │  🥈 Carlos Ruiz         ││
│             │  │ → Enviar cotización  │ │  🥉 Diana Méndez        ││
│             │  │                      │ │     Roberto Pérez       ││
│             │  │ ⏰ FollowUp pendiente│ │                         ││
│             │  │ Carlos Ruiz (68)     │ │ ────────────────────    ││
│             │  │ → Mensaje sugerido   │ │ Insignias:             ││
│             │  │                      │ │ 🏅 Mejor cierre mes    ││
│             │  │ ✅ Tarea vencida     │ │ ⚡ Racha 5 días         ││
│             │  │ Llamar a Pedro S.    │ │ 🎯 80% de meta          ││
│             │  │ → Completar          │ │                         ││
│             │  └──────────────────────┘ └─────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 📈 MI ACTIVIDAD (últimos 7 días)                ││
│             │  │                                                  ││
│             │  │  Mensajes enviados:  ████████████  45            ││
│             │  │  Leads contactados:  ████████      28            ││
│             │  │  Cierres:           ████           4             ││
│             │  │  Tiempo respuesta:   Promedio 12 min             ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.9 IA Comercial (Chat Assistant)

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  🤖 IA Comercial FAIREX                              │
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │                                                  ││
│             │  │  Preguntas sugeridas:                            ││
│             │  │  ┌────────────────────────────────────────────┐  ││
│             │  │  │ ¿Quién tiene mayor probabilidad de compra? │  ││
│             │  │  └────────────────────────────────────────────┘  ││
│             │  │  ┌────────────────────────────────────────────┐  ││
│             │  │  │ ¿Cuáles son mis oportunidades críticas?    │  ││
│             │  │  └────────────────────────────────────────────┘  ││
│             │  │  ┌────────────────────────────────────────────┐  ││
│             │  │  │ ¿Qué vendedor tiene mejor rendimiento?     │  ││
│             │  │  └────────────────────────────────────────────┘  ││
│             │  │                                                  ││
│             │  │  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──  ││
│             │  │                                                  ││
│             │  │  👤 Tú:                                         ││
│             │  │  "¿Cuáles son mis leads más calientes hoy?"     ││
│             │  │                                                  ││
│             │  │  🤖 FAIREX IA:                                  ││
│             │  │  "Tienes 3 leads con score superior a 90:        ││
│             │  │                                                  ││
│             │  │   1. **María García** (Score: 96)                ││
│             │  │      Canal: WhatsApp · Etapa: Caliente           ││
│             │  │      💡 Acción: Enviar cotización hoy            ││
│             │  │                                                  ││
│             │  │   2. **Pedro Sánchez** (Score: 93)               ││
│             │  │      Canal: Messenger · Etapa: Listo cerrar      ││
│             │  │      💡 Acción: Llamar para cerrar               ││
│             │  │                                                  ││
│             │  │   3. **Luisa Vega** (Score: 92)                  ││
│             │  │      Canal: WhatsApp · Etapa: Listo cerrar       ││
│             │  │      💡 Acción: Confirmar fecha de firma         ││
│             │  │                                                  ││
│             │  │   Recomendación: Prioriza a María García,        ││
│             │  │   lleva 2 días sin contacto y su interés         ││
│             │  │   podría enfriarse."                             ││
│             │  │                                                  ││
│             │  │  [📇 Ver lead] [📅 Agendar] [💬 Ir a chat]     ││
│             │  │                                                  ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 🤖 Pregúntame sobre tu negocio...           ▶   ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.10 Director Comercial IA (Briefing)

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  🤖 Director Comercial IA         📅 1 Jun 2026     │
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  📋 RESUMEN EJECUTIVO DEL DÍA                   ││
│             │  │                                                  ││
│             │  │  ┌────────────────────────────────────────────┐  ││
│             │  │  │ "Tu equipo tuvo un día productivo. 5       │  ││
│             │  │  │ leads nuevos ingresaron, 3 están calientes │  ││
│             │  │  │ y 2 cierres confirmados. Sin embargo,      │  ││
│             │  │  │ hay 12 seguimientos pendientes que          │  ││
│             │  │  │ necesitan atención inmediata."              │  ││
│             │  │  └────────────────────────────────────────────┘  ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ │
│             │  │Nuevos │ │Calien.│ │Cierres│ │Follow │ │Retarg.│ │
│             │  │  5    │ │  3 🔥 │ │  2 ✅ │ │ 12 ⚠️ │ │  4    │ │
│             │  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ │
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ ⚠️ ALERTAS CRÍTICAS                             ││
│             │  │                                                  ││
│             │  │ 🔴 12 seguimientos pendientes sin atender       ││
│             │  │    → Vendedores: Carlos (5), Diana (4), Rob (3) ││
│             │  │                                                  ││
│             │  │ 🟡 Lead caliente María García sin contacto 48h  ││
│             │  │    → Riesgo de enfriamiento. Priorizar hoy.     ││
│             │  │                                                  ││
│             │  │ 🟡 Roberto Pérez: 0 cierres en 2 semanas       ││
│             │  │    → Considerar coaching o reasignación de leads ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 💡 RECOMENDACIONES IA                           ││
│             │  │                                                  ││
│             │  │ 1. Priorizar cierre de María García hoy         ││
│             │  │    [Crear tarea] [Asignar vendedor]              ││
│             │  │                                                  ││
│             │  │ 2. Reasignar 3 leads de Roberto a Ana           ││
│             │  │    [Ejecutar reasignación]                       ││
│             │  │                                                  ││
│             │  │ 3. Activar retargeting para leads de Mayo        ││
│             │  │    [Activar campaña]                             ││
│             │  │                                                  ││
│             │  │ 4. Revisar pricing del servicio básico           ││
│             │  │    (3 prospectos mencionaron precio alto)         ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 📈 FORECAST MENSUAL                             ││
│             │  │                                                  ││
│             │  │ Meta: $200,000   Actual: $142,500   Proyect: $185K│
│             │  │ ████████████████████░░░░░  71% alcanzado        ││
│             │  │                                                  ││
│             │  │ Probabilidad de alcanzar meta: 78%              ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.11 Calendario Inteligente

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Calendario        [◀ Junio 2026 ▶]  [Día][Sem][Mes]│
│  (nav)      │                    [+ Nuevo Evento]                  │
│             │                                                      │
│             │  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐ │
│             │  │ Lun  │ Mar  │ Mié  │ Jue  │ Vie  │ Sáb  │ Dom  │ │
│             │  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│             │  │  1   │  2   │  3   │  4   │  5   │  6   │  7   │ │
│             │  │🔵10am│      │🟢2pm │🔵9am │      │      │      │ │
│             │  │Llamar│      │Follow│Reunión│      │      │      │ │
│             │  │María │      │up    │equipo│      │      │      │ │
│             │  │      │      │Carlos│      │      │      │      │ │
│             │  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│             │  │  8   │  9   │ 10   │ 11   │ 12   │ 13   │ 14   │ │
│             │  │🔴11am│🟡3pm │      │🟢10am│🔵2pm │      │      │ │
│             │  │Cierre│Demo  │      │Instal│Retarg│      │      │ │
│             │  │Pedro │client│      │ación │eting │      │      │ │
│             │  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤ │
│             │  │...                                               │ │
│             │  └──────────────────────────────────────────────────┘ │
│             │                                                      │
│             │  PRÓXIMOS EVENTOS                                    │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 🔵 Hoy 10:00 AM — Llamar a María García        ││
│             │  │    🤖 Auto-generado por IA · Lead caliente      ││
│             │  │                                                  ││
│             │  │ 🟢 3 Jun 2:00 PM — FollowUp Carlos Ruiz         ││
│             │  │    🤖 FollowUp IA · Intento 2 de 5              ││
│             │  │                                                  ││
│             │  │ 🔵 4 Jun 9:00 AM — Reunión semanal equipo       ││
│             │  │    📅 Recurrente · Todos los jueves              ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  Colores: 🔴 Urgente  🔵 Normal  🟢 IA-generado    │
│             │           🟡 Tentativo                              │
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.12 Sistema de Tareas

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Tareas              [+ Nueva Tarea]                 │
│  (nav)      │  [Todas] [Mías] [Equipo] [IA-generadas]            │
│             │  [Vista: ▦ Lista  ▥ Board]                          │
│             │                                                      │
│             │  ⚠️ VENCIDAS (3)                                    │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 🔴 Llamar a Pedro Sánchez para cerrar           ││
│             │  │    Asignado: Ana · Vencida hace 1 día           ││
│             │  │    🤖 Auto-generada · Lead score: 93            ││
│             │  │    [Completar] [Reprogramar] [Reasignar]        ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ 🔴 Enviar propuesta a Fernanda Cruz              ││
│             │  │    Asignado: Carlos · Vencida hace 2 días       ││
│             │  │    [Completar] [Reprogramar] [Reasignar]        ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ 🔴 Seguimiento telefónico Laura Díaz             ││
│             │  │    Asignado: Diana · Vencida hoy                ││
│             │  │    🤖 FollowUp IA · Intento 3 de 5              ││
│             │  │    [Completar] [Reprogramar] [Reasignar]        ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  📅 HOY (5)                                         │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 🟡 Enviar cotización a María García              ││
│             │  │    Asignado: Ana · Vence: Hoy 5:00 PM           ││
│             │  │    🤖 Auto-generada · Prioridad: ALTA           ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ 🔵 Actualizar CRM con notas de llamada          ││
│             │  │    Asignado: Carlos · Vence: Hoy 6:00 PM        ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ ... 3 más                                       ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  📆 PRÓXIMOS (12)                                   │
│             │  [Ver todos →]                                      │
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.13 Reportes de Ventas

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Reportes > Ventas     📅 Jun 2026 ▼    [⬇ Exportar]│
│  (nav)      │                                                      │
│             │  [Ventas] [Equipo] [Canales] [Pipeline] [IA]        │
│             │                                                      │
│             │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│             │  │ Ventas   │ │ Tasa     │ │ Ticket   │ │ Tiempo   ││
│             │  │ Totales  │ │ Cierre   │ │ Promedio │ │ Cierre   ││
│             │  │ $142,500 │ │  23%     │ │ $11,875  │ │ 8.5 días ││
│             │  │ +18% ↑   │ │  +2% ↑   │ │  +5% ↑   │ │ -1.2d ↑  ││
│             │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  📈 VENTAS POR PERÍODO                          ││
│             │  │                                                  ││
│             │  │  $150K ┤                              ╱──        ││
│             │  │  $120K ┤                    ╱─────────╱           ││
│             │  │   $90K ┤          ╱────────╱                     ││
│             │  │   $60K ┤   ╱─────╱                               ││
│             │  │   $30K ┤──╱                                      ││
│             │  │        └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──     ││
│             │  │         Ene Feb Mar Abr May Jun                   ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌─────────────────────┐ ┌─────────────────────────┐│
│             │  │ POR SERVICIO        │ │ POR CANAL               ││
│             │  │                     │ │                         ││
│             │  │ Premium    45% ████ │ │ WhatsApp   62% ██████  ││
│             │  │ Estándar   30% ███  │ │ Messenger  18% ██      ││
│             │  │ Básico     15% ██   │ │ Instagram  12% █       ││
│             │  │ Consultoría 10% █   │ │ Email       5% ░       ││
│             │  │                     │ │ Otros       3% ░       ││
│             │  └─────────────────────┘ └─────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ TABLA DETALLADA                                 ││
│             │  │                                                  ││
│             │  │ Período   │ Leads │ Cierres │ Valor   │ Conv.   ││
│             │  │ Semana 1  │  12   │    3    │ $35,625 │  25%    ││
│             │  │ Semana 2  │  15   │    4    │ $47,500 │  27%    ││
│             │  │ Semana 3  │  11   │    3    │ $35,625 │  27%    ││
│             │  │ Semana 4  │   9   │    2    │ $23,750 │  22%    ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.14 Configuración — Canales — WhatsApp

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Configuración > Canales > WhatsApp                  │
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  LÍNEAS CONECTADAS                [+ Agregar]   ││
│             │  │                                                  ││
│             │  │  ┌──────────────────────────────────────────┐    ││
│             │  │  │ 📱 WhatsApp Ventas                      │    ││
│             │  │  │ +52 55 1234 5678                        │    ││
│             │  │  │ Estado: 🟢 Conectado                    │    ││
│             │  │  │ Mensajes hoy: 45                        │    ││
│             │  │  │ Asignación: Round-robin (Ana, Carlos)   │    ││
│             │  │  │ [Configurar] [Desconectar]              │    ││
│             │  │  └──────────────────────────────────────────┘    ││
│             │  │                                                  ││
│             │  │  ┌──────────────────────────────────────────┐    ││
│             │  │  │ 📱 WhatsApp Soporte                     │    ││
│             │  │  │ +52 55 8765 4321                        │    ││
│             │  │  │ Estado: 🟢 Conectado                    │    ││
│             │  │  │ Mensajes hoy: 12                        │    ││
│             │  │  │ Asignación: Diana Méndez (fijo)         │    ││
│             │  │  │ [Configurar] [Desconectar]              │    ││
│             │  │  └──────────────────────────────────────────┘    ││
│             │  │                                                  ││
│             │  │  ┌──────────────────────────────────────────┐    ││
│             │  │  │ 📱 WhatsApp Sucursal Monterrey          │    ││
│             │  │  │ +52 81 5555 1234                        │    ││
│             │  │  │ Estado: 🔴 Desconectado                 │    ││
│             │  │  │ [Reconectar] [Eliminar]                 │    ││
│             │  │  └──────────────────────────────────────────┘    ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  CONFIGURACIÓN IA PARA WHATSAPP                 ││
│             │  │                                                  ││
│             │  │  Respuesta automática IA:   [🟢 Activado ▼]     ││
│             │  │  Tono de comunicación:      [Profesional ▼]     ││
│             │  │  Idioma:                    [Español MX ▼]      ││
│             │  │  Horario de respuesta auto: [8:00 - 20:00]      ││
│             │  │  Mensaje fuera de horario:  [Configurar]        ││
│             │  │                                                  ││
│             │  │  [Guardar cambios]                               ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.15 Configuración — Scoring IA

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Configuración > Scoring IA                          │
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  RANGOS DE SCORING                               ││
│             │  │                                                  ││
│             │  │  🔥 90-100  Listo para comprar  [Editar label]  ││
│             │  │  🟠 70-89   Muy interesado      [Editar label]  ││
│             │  │  🟡 50-69   Interés moderado    [Editar label]  ││
│             │  │  🔵 30-49   Curioso             [Editar label]  ││
│             │  │  ⚪  1-29   Poco interés        [Editar label]  ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  FACTORES DE SCORING                            ││
│             │  │                                                  ││
│             │  │  Factor                    │ Peso │ Estado       ││
│             │  │  ─────────────────────────────────────────────   ││
│             │  │  Solicita precio/cotización │ +20  │ 🟢 Activo  ││
│             │  │  Pregunta disponibilidad    │ +15  │ 🟢 Activo  ││
│             │  │  Menciona urgencia          │ +25  │ 🟢 Activo  ││
│             │  │  Responde rápido (<1h)      │ +10  │ 🟢 Activo  ││
│             │  │  Hace múltiples preguntas   │ +15  │ 🟢 Activo  ││
│             │  │  Dice "lo voy a pensar"     │ -10  │ 🟢 Activo  ││
│             │  │  No responde en 48h         │ -15  │ 🟢 Activo  ││
│             │  │  Menciona competencia       │ -5   │ 🟢 Activo  ││
│             │  │                                                  ││
│             │  │  [+ Agregar factor personalizado]                ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  UMBRAL DE LEAD CALIENTE                        ││
│             │  │                                                  ││
│             │  │  Score mínimo para alerta: [90] ────●── 100     ││
│             │  │  Notificar por:  ☑ App  ☑ WhatsApp  ☑ Email    ││
│             │  │  Crear tarea automática: [🟢 Sí]                ││
│             │  │                                                  ││
│             │  │  [Guardar configuración]                         ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.16 Centro de Notificaciones

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  🔔 Notificaciones          [Marcar todas como leídas]│
│  (nav)      │  [Todas] [No leídas (7)] [Alertas] [IA]            │
│             │                                                      │
│             │  HOY                                                 │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 🔥 LEAD CALIENTE — María García alcanzó score 96││
│             │  │    hace 5 min · 🤖 IA · [Ver lead]              ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ 💬 Nuevo mensaje de Pedro Sánchez en WhatsApp   ││
│             │  │    hace 15 min · [Ir a conversación]            ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ ⏰ FollowUp pendiente: Carlos Ruiz              ││
│             │  │    hace 1 hora · 🤖 IA sugiere mensaje          ││
│             │  │    [Ver sugerencia] [Enviar] [Posponer]         ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ ✅ Tarea completada: Ana López cerró venta       ││
│             │  │    hace 2 horas                                  ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ 🤖 Director IA: Briefing diario disponible      ││
│             │  │    hace 3 horas · [Ver briefing]                ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  AYER                                                │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ ⚠️ Roberto Pérez: 0 cierres en 14 días          ││
│             │  │    🤖 IA recomienda coaching · [Ver perfil]      ││
│             │  ├──────────────────────────────────────────────────┤│
│             │  │ 📊 Reporte semanal generado automáticamente     ││
│             │  │    [Descargar PDF]                               ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.17 Configuración — Gestión de Equipo

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Configuración > Equipo            [+ Invitar usuario]│
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  MIEMBROS DEL EQUIPO (6 de 10 licencias)        ││
│             │  │                                                  ││
│             │  │  👤 │ Nombre        │ Rol        │ Estado │ ⋯   ││
│             │  │  ───┼───────────────┼────────────┼────────┼───   ││
│             │  │  JP │ Juan Pérez    │ Owner      │ 🟢     │ ⋯   ││
│             │  │  AL │ Ana López     │ Vendedor   │ 🟢     │ ⋯   ││
│             │  │  CR │ Carlos Ruiz   │ Vendedor   │ 🟢     │ ⋯   ││
│             │  │  DM │ Diana Méndez  │ Vendedor   │ 🟡     │ ⋯   ││
│             │  │  RP │ Roberto Pérez │ Vendedor   │ 🟢     │ ⋯   ││
│             │  │  MG │ Mario García  │ Director   │ 🟢     │ ⋯   ││
│             │  │                                                  ││
│             │  │  ⋯ menú: Editar rol · Desactivar · Eliminar     ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  INVITACIONES PENDIENTES                        ││
│             │  │                                                  ││
│             │  │  📧 laura@empresa.com    │ Vendedor  │ Enviada  ││
│             │  │     hace 2 días          │           │ [Reenviar]││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  EQUIPOS / GRUPOS                               ││
│             │  │                                                  ││
│             │  │  Equipo Ventas CDMX:  Ana, Carlos, Diana        ││
│             │  │  Equipo Ventas MTY:   Roberto                   ││
│             │  │                                                  ││
│             │  │  [+ Crear equipo]                                ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.18 Configuración — Billing

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Configuración > Facturación                         │
│  (nav)      │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  PLAN ACTUAL: PRO                                ││
│             │  │                                                  ││
│             │  │  $99 USD / mes  (facturación mensual)            ││
│             │  │  Próxima factura: 1 Jul 2026                    ││
│             │  │                                                  ││
│             │  │  Incluye:                                        ││
│             │  │  ✅ 10 usuarios                                  ││
│             │  │  ✅ 3 canales                                    ││
│             │  │  ✅ IA Comercial                                 ││
│             │  │  ✅ FollowUp IA                                  ││
│             │  │  ✅ Retargeting IA                               ││
│             │  │  ✅ Dashboard ejecutivo                          ││
│             │  │  ❌ Director Comercial IA (Enterprise)           ││
│             │  │  ❌ Marketing Intelligence (Enterprise)          ││
│             │  │                                                  ││
│             │  │  Uso actual:                                     ││
│             │  │  Usuarios:      6 / 10                           ││
│             │  │  Canales:       2 / 3                            ││
│             │  │  Tokens IA:     45,000 / 100,000                ││
│             │  │  ████████████████░░░░░ 45%                      ││
│             │  │                                                  ││
│             │  │  [Cambiar plan] [Cambiar a anual (-20%)]        ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  HISTORIAL DE FACTURAS                          ││
│             │  │                                                  ││
│             │  │  Fecha        │ Monto  │ Estado  │ Descarga     ││
│             │  │  1 Jun 2026   │ $99.00 │ ✅ Pago │ [PDF]        ││
│             │  │  1 May 2026   │ $99.00 │ ✅ Pago │ [PDF]        ││
│             │  │  1 Abr 2026   │ $99.00 │ ✅ Pago │ [PDF]        ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │  MÉTODO DE PAGO                                 ││
│             │  │  💳 Visa terminada en 4242 · Exp: 12/28         ││
│             │  │  [Cambiar método de pago]                       ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.19 Admin FAIREX (Super Admin)

```
┌── ADMIN NAV ─┬─────────────────────────────────────────────────────┐
│              │  🛡️ FAIREX Admin Panel                              │
│  🏠 Overview │                                                     │
│  🏢 Empresas │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  👥 Usuarios │  │ Empresas │ │ Usuarios │ │ MRR      │ │ AI     ││
│  💰 Billing  │  │ Activas  │ │ Totales  │ │          │ │ Tokens ││
│  📊 Analytics│  │   127    │ │   843    │ │ $12,573  │ │  2.1M  ││
│  🤖 AI Usage │  │ +8 ↑     │ │ +23 ↑    │ │ +12% ↑   │ │ 68% ▓ ││
│  🔧 System   │  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│  🚩 Features │                                                     │
│              │  EMPRESAS RECIENTES                                 │
│              │  ┌─────────────────────────────────────────────────┐│
│              │  │ Empresa          │ Plan      │ Usuarios │ Estado││
│              │  │ Clínica Dental   │ Pro       │ 6        │ 🟢    ││
│              │  │ Inmobiliaria XY  │ Enterprise│ 25       │ 🟢    ││
│              │  │ Agencia ABC      │ Starter   │ 2        │ 🟡    ││
│              │  │ Constructora Z   │ Pro       │ 8        │ 🟢    ││
│              │  └─────────────────────────────────────────────────┘│
│              │                                                     │
│              │  ALERTAS DEL SISTEMA                                │
│              │  ┌─────────────────────────────────────────────────┐│
│              │  │ ⚠️ Empresa "Agencia ABC" — pago fallido        ││
│              │  │ ⚠️ Alto consumo IA — Inmobiliaria XY (95%)     ││
│              │  │ ✅ Todas las integraciones operativas            ││
│              │  └─────────────────────────────────────────────────┘│
└──────────────┴─────────────────────────────────────────────────────┘
```

### 6.20 Marketing Intelligence

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Marketing Intelligence    📅 Jun 2026 ▼            │
│  (nav)      │                                                      │
│             │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│             │  │ CPL      │ │ CPA      │ │ ROAS     │ │ ROI      ││
│             │  │ $12.50   │ │ $85.00   │ │ 4.2x     │ │ 320%     ││
│             │  │ -8% ↑    │ │ -3% ↑    │ │ +15% ↑   │ │ +22% ↑   ││
│             │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
│             │                                                      │
│             │  FUENTES DE LEADS                                   │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ Fuente        │ Leads │ Conv. │ CPL    │ ROAS   ││
│             │  │ Meta Ads      │  28   │  7    │ $11.20 │ 5.1x   ││
│             │  │ Google Ads    │  12   │  3    │ $18.50 │ 3.2x   ││
│             │  │ Orgánico WA   │   5   │  2    │ $0.00  │ ∞      ││
│             │  │ Instagram Org │   2   │  0    │ $0.00  │ —      ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  RENDIMIENTO POR CAMPAÑA                            │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ Campaña              │ Gasto │ Leads │ Cierres  ││
│             │  │ Campaña Premium Jun  │ $350  │  15   │    4     ││
│             │  │ Retargeting May      │ $120  │   8   │    2     ││
│             │  │ Branding General     │ $200  │   5   │    1     ││
│             │  └──────────────────────────────────────────────────┘│
│             │                                                      │
│             │  ┌──────────────────────────────────────────────────┐│
│             │  │ 🤖 INSIGHT IA                                   ││
│             │  │ "La campaña Premium Jun tiene el mejor ROAS.    ││
│             │  │  Recomiendo incrementar presupuesto 20% y       ││
│             │  │  reducir Branding General que tiene bajo         ││
│             │  │  rendimiento."                                   ││
│             │  └──────────────────────────────────────────────────┘│
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.21 Empty State (Primer uso)

```
┌── SIDEBAR ──┬──────────────────────────────────────────────────────┐
│             │  Dashboard                                           │
│  (nav)      │                                                      │
│             │           ┌──────────────────────────────┐           │
│             │           │                              │           │
│             │           │     🚀                       │           │
│             │           │                              │           │
│             │           │  ¡Bienvenido a FAIREX!       │           │
│             │           │                              │           │
│             │           │  Completa estos pasos para   │           │
│             │           │  activar tu Business OS:     │           │
│             │           │                              │           │
│             │           │  ✅ 1. Crear empresa         │           │
│             │           │  ☐  2. Conectar WhatsApp     │           │
│             │           │  ☐  3. Invitar equipo        │           │
│             │           │  ☐  4. Importar leads        │           │
│             │           │  ☐  5. Configurar IA         │           │
│             │           │                              │           │
│             │           │  ██░░░░░░░░░░░░  20%         │           │
│             │           │                              │           │
│             │           │  [Continuar configuración →] │           │
│             │           │                              │           │
│             │           │  ── o ──                     │           │
│             │           │                              │           │
│             │           │  [📹 Ver tour en video]      │           │
│             │           │  [📖 Leer documentación]     │           │
│             │           │                              │           │
│             │           └──────────────────────────────┘           │
│             │                                                      │
└─────────────┴──────────────────────────────────────────────────────┘
```

### 6.22 Vista Mobile — Conversaciones

```
┌──────────────────────────┐
│  💬 Conversaciones   🔍  │
├──────────────────────────┤
│ [Todas][Mías][Sin asign.]│
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ 🔥 María García      │ │
│ │ "¿cuándo podemos     │ │
│ │  agendar?"           │ │
│ │ Score: 96 · hace 5m  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Pedro Sánchez        │ │
│ │ "Lo voy a pensar"   │ │
│ │ Score: 45 · hace 1h  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Laura Díaz           │ │
│ │ "¿Tienen sucursal?"  │ │
│ │ Score: 72 · hace 3h  │ │
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ Carlos Ruiz          │ │
│ │ "Necesito cotización"│ │
│ │ Score: 68 · hace 5h  │ │
│ └──────────────────────┘ │
│          ...             │
├──────────────────────────┤
│ 📈    💬    📇   ✅  ≡  │
│ Dash  Chat  Lead Task Más│
└──────────────────────────┘
```

---

## 7. ARQUITECTURA MULTIEMPRESA

### 7.1 Estrategia de Aislamiento

```
┌─────────────────────────────────────────────────────────────┐
│                   PLATAFORMA FAIREX                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              PostgreSQL (Supabase)                   │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │ Tenant A │  │ Tenant B │  │ Tenant C │          │    │
│  │  │ company_ │  │ company_ │  │ company_ │          │    │
│  │  │ id = 1   │  │ id = 2   │  │ id = 3   │          │    │
│  │  │          │  │          │  │          │          │    │
│  │  │ Leads    │  │ Leads    │  │ Leads    │          │    │
│  │  │ Convs    │  │ Convs    │  │ Convs    │          │    │
│  │  │ Users    │  │ Users    │  │ Users    │          │    │
│  │  │ Tasks    │  │ Tasks    │  │ Tasks    │          │    │
│  │  │ Config   │  │ Config   │  │ Config   │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                     │    │
│  │  Row Level Security (RLS) on ALL tables             │    │
│  │  Policy: auth.jwt() -> company_id == row.company_id │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  Shared: auth.users · platform_config · plans · billing     │
│  Isolated: Todo lo demás (por company_id)                   │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Modelo de Datos Multi-tenant

```sql
-- Tabla central de empresas
companies
├── id (UUID, PK)
├── name
├── industry
├── country
├── plan_id (FK → plans)
├── settings (JSONB)
├── branding (JSONB — logo, colors)
├── ai_config (JSONB — tono, idioma, industria)
├── created_at
├── updated_at
└── is_active (boolean)

-- Membresías (relación usuario-empresa)
company_members
├── id (UUID, PK)
├── company_id (FK → companies) ◄── RLS key
├── user_id (FK → auth.users)
├── role (ENUM: owner, director, supervisor, vendedor)
├── is_active
├── invited_at
├── accepted_at
└── permissions (JSONB — overrides)

-- TODAS las tablas de negocio incluyen:
leads
├── id (UUID, PK)
├── company_id (FK → companies) ◄── RLS key
├── assigned_to (FK → company_members)
├── ...campos del lead...
├── ai_memory (JSONB)
│   ├── resumen_inteligente
│   ├── etapa_venta
│   ├── nivel_interes
│   ├── objeciones
│   ├── necesidades
│   ├── score_lead
│   ├── prioridad
│   ├── listo_cerrar
│   └── ultima_accion
├── followup_pendiente (boolean)
├── fecha_followup (timestamp)
├── intentos_followup (integer)
├── retargeting_pendiente (boolean)
├── fecha_retargeting (timestamp)
├── intentos_retargeting (integer)
├── created_at
└── updated_at

conversations
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── lead_id (FK → leads)
├── channel (ENUM: whatsapp, messenger, instagram, telegram, email, webchat)
├── channel_line_id (FK → channel_lines)
├── assigned_to (FK → company_members)
├── status (ENUM: open, pending, closed)
├── last_message_at
├── unread_count
└── created_at

messages
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── conversation_id (FK → conversations)
├── sender_type (ENUM: lead, user, ai, system)
├── sender_id
├── content (text)
├── media_url
├── media_type
├── metadata (JSONB)
├── is_read (boolean)
└── created_at

tasks
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── title
├── description
├── assigned_to (FK → company_members)
├── lead_id (FK → leads, nullable)
├── source (ENUM: manual, ai_followup, ai_retargeting, ai_hotlead, ai_director)
├── priority (ENUM: low, medium, high, urgent)
├── status (ENUM: pending, in_progress, completed, cancelled)
├── due_date
├── completed_at
└── created_at

calendar_events
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── title
├── description
├── type (ENUM: meeting, call, followup, installation, appointment)
├── lead_id (FK → leads, nullable)
├── assigned_to (FK → company_members)
├── source (ENUM: manual, ai_generated)
├── start_time
├── end_time
├── is_recurring (boolean)
├── recurrence_rule
├── reminder_minutes
└── created_at

channel_lines
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── channel_type (ENUM: whatsapp, messenger, instagram, telegram, email, webchat)
├── label (e.g., "WhatsApp Ventas")
├── phone_number / account_id
├── credentials (encrypted JSONB)
├── assignment_mode (ENUM: round_robin, fixed, manual)
├── assigned_members (UUID[])
├── ai_config (JSONB)
├── status (ENUM: connected, disconnected, error)
└── created_at

notifications
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── user_id (FK → company_members)
├── type (ENUM: hot_lead, new_message, followup, task, ai_insight, system)
├── title
├── body
├── data (JSONB — links, lead_id, etc.)
├── is_read (boolean)
├── channels_sent (ENUM[]: app, whatsapp, email, push)
└── created_at

ai_interactions
├── id (UUID, PK)
├── company_id (FK) ◄── RLS key
├── user_id (FK, nullable)
├── lead_id (FK, nullable)
├── agent_type (ENUM: analyzer, scoring, pipeline, followup, retargeting, hotlead, director, query)
├── input_tokens (integer)
├── output_tokens (integer)
├── prompt_template_id
├── input_context (JSONB)
├── output_result (JSONB)
├── latency_ms (integer)
└── created_at

-- Tablas compartidas (NO tienen company_id)
plans
├── id
├── name (starter, pro, enterprise)
├── price_monthly
├── price_yearly
├── limits (JSONB: max_users, max_channels, max_ai_tokens, features[])
└── is_active

subscriptions
├── id
├── company_id (FK)
├── plan_id (FK)
├── status (active, past_due, cancelled)
├── current_period_start
├── current_period_end
├── payment_method (JSONB)
└── stripe_subscription_id
```

### 7.3 RLS Policies (Ejemplo)

```sql
-- Política base para todas las tablas con company_id
CREATE POLICY "tenant_isolation" ON leads
  USING (
    company_id IN (
      SELECT company_id FROM company_members
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Política adicional para vendedores (solo sus leads)
CREATE POLICY "vendor_own_leads" ON leads
  FOR SELECT USING (
    assigned_to = (
      SELECT id FROM company_members
      WHERE user_id = auth.uid()
      AND role = 'vendedor'
    )
    OR
    EXISTS (
      SELECT 1 FROM company_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'director', 'supervisor')
    )
  );
```

### 7.4 Resolución de Tenant

```
Request entrante
  │
  ▼
Middleware Next.js
  │
  ├── Extraer JWT de Supabase Auth
  ├── Decodificar user_id
  ├── Consultar company_members → obtener company_id activo
  ├── Inyectar company_id en contexto de request
  └── Todas las queries posteriores filtran por company_id
      (reforzado por RLS en DB)
```

---

## 8. ARQUITECTURA DE PERMISOS Y ROLES

### 8.1 Modelo RBAC (Role-Based Access Control)

```
┌─────────────────────────────────────────────────────────────┐
│                    RBAC FAIREX                               │
│                                                             │
│  NIVEL PLATAFORMA                                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Super Admin FAIREX                                 │    │
│  │  (Equipo interno FAIREX — gestión de la plataforma) │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  NIVEL TENANT (Por empresa)                                 │
│  ┌──────────────────────────────────────────────────┐       │
│  │                                                  │       │
│  │  OWNER ──────── Acceso total a la empresa        │       │
│  │    │                                             │       │
│  │    ├── DIRECTOR COMERCIAL ─── Supervisión +      │       │
│  │    │     │                    métricas + IA       │       │
│  │    │     │                                       │       │
│  │    │     ├── SUPERVISOR ────── Monitoreo equipo   │       │
│  │    │     │     │                                  │       │
│  │    │     │     └── VENDEDOR ─── Operación propia  │       │
│  │    │     │                                       │       │
│  │    │     └── VENDEDOR ───────── Operación propia  │       │
│  │    │                                             │       │
│  │    └── (Futuro: ADMIN, READONLY, CUSTOM)         │       │
│  │                                                  │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Matriz de Permisos Detallada

```
RECURSO                    OWNER    DIRECTOR   SUPERVISOR   VENDEDOR
─────────────────────────────────────────────────────────────────────

LEADS
  Ver todos                  ✅        ✅          ✅ (equipo)  ❌
  Ver propios                ✅        ✅          ✅           ✅
  Crear                      ✅        ✅          ✅           ✅
  Editar (cualquiera)        ✅        ✅          ✅ (equipo)  ❌
  Editar (propios)           ✅        ✅          ✅           ✅
  Eliminar                   ✅        ✅          ❌           ❌
  Asignar/Reasignar          ✅        ✅          ✅ (equipo)  ❌
  Importar/Exportar          ✅        ✅          ❌           ❌
  Ver análisis IA            ✅        ✅          ✅           ✅ (propios)

CONVERSACIONES
  Ver todas                  ✅        ✅          ✅ (equipo)  ❌
  Ver propias                ✅        ✅          ✅           ✅
  Responder (cualquiera)     ✅        ✅          ✅ (equipo)  ❌
  Responder (propias)        ✅        ✅          ✅           ✅
  Reasignar                  ✅        ✅          ✅           ❌
  Cerrar/Reabrir             ✅        ✅          ✅           ✅ (propias)

PIPELINE
  Ver                        ✅        ✅          ✅           ❌
  Mover leads                ✅        ✅          ✅ (equipo)  ❌
  Configurar etapas          ✅        ✅          ❌           ❌

DASHBOARD
  Ejecutivo (empresa)        ✅        ✅          ❌           ❌
  Equipo                     ✅        ✅          ✅           ❌
  Individual (propio)        ✅        ✅          ✅           ✅
  Individual (otros)         ✅        ✅          ✅ (equipo)  ❌

TAREAS
  Ver todas                  ✅        ✅          ✅ (equipo)  ❌
  Ver propias                ✅        ✅          ✅           ✅
  Crear para otros           ✅        ✅          ✅ (equipo)  ❌
  Crear propias              ✅        ✅          ✅           ✅
  Completar (cualquiera)     ✅        ✅          ✅ (equipo)  ❌
  Completar (propias)        ✅        ✅          ✅           ✅

CALENDARIO
  Ver todos                  ✅        ✅          ✅ (equipo)  ❌
  Ver propio                 ✅        ✅          ✅           ✅
  Crear eventos              ✅        ✅          ✅           ✅
  Editar (otros)             ✅        ✅          ✅ (equipo)  ❌

IA COMERCIAL
  Chat con IA                ✅        ✅          ✅           ❌
  Ver insights               ✅        ✅          ✅           ❌
  Director Comercial IA      ✅        ✅          ❌           ❌
  Configurar IA              ✅        ❌          ❌           ❌

REPORTES
  Ver reportes empresa       ✅        ✅          ❌           ❌
  Ver reportes equipo        ✅        ✅          ✅           ❌
  Exportar                   ✅        ✅          ❌           ❌
  Crear personalizados       ✅        ✅          ❌           ❌

MARKETING
  Ver métricas               ✅        ✅          ❌           ❌
  Configurar fuentes         ✅        ❌          ❌           ❌

CONFIGURACIÓN
  Empresa/Perfil             ✅        ✅ (parcial) ❌          ❌
  Equipo/Usuarios            ✅        ❌          ❌           ❌
  Canales                    ✅        ✅          ❌           ❌
  Pipeline                   ✅        ✅          ❌           ❌
  Scoring                    ✅        ✅          ❌           ❌
  IA                         ✅        ❌          ❌           ❌
  Notificaciones             ✅        ✅          ✅           ✅ (propias)
  Campos personalizados      ✅        ✅          ❌           ❌
  Integraciones              ✅        ❌          ❌           ❌
  API Keys                   ✅        ❌          ❌           ❌
  Seguridad                  ✅        ❌          ❌           ❌
  Billing                    ✅        ❌          ❌           ❌
  Audit Log                  ✅        ✅          ❌           ❌
```

### 8.3 Implementación Técnica

```typescript
// Middleware de autorización
// Archivo: middleware/authorization.ts

interface Permission {
  resource: string;      // 'leads' | 'conversations' | 'tasks' | ...
  action: string;        // 'view_all' | 'view_own' | 'create' | 'edit' | 'delete' | ...
  scope: 'all' | 'team' | 'own';
}

// Definido en DB como JSONB en la tabla roles
// Con posibilidad de override por usuario en company_members.permissions

// Check en cada API route / Server Component:
// 1. Verificar autenticación (JWT válido)
// 2. Resolver tenant (company_id)
// 3. Verificar rol del usuario
// 4. Verificar permiso específico
// 5. Aplicar scope (all/team/own) al query
```

---

## 9. ARQUITECTURA DE IA

### 9.1 Orquestación de Agentes

```
┌─────────────────────────────────────────────────────────────────┐
│                  ORQUESTADOR DE AGENTES IA                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    DISPATCHER                            │   │
│  │  Recibe eventos → Determina agente(s) → Ejecuta         │   │
│  └────────┬──────────┬──────────┬──────────┬────────────────┘   │
│           │          │          │          │                     │
│  ┌────────▼──┐ ┌─────▼────┐ ┌──▼───────┐ ┌▼──────────┐        │
│  │ANALIZADOR │ │ SCORING  │ │ PIPELINE │ │ FOLLOWUP  │        │
│  │           │ │          │ │          │ │           │        │
│  │Trigger:   │ │Trigger:  │ │Trigger:  │ │Trigger:   │        │
│  │Nuevo msg  │ │Post-     │ │Post-     │ │Timer de   │        │
│  │           │ │análisis  │ │scoring   │ │inactividad│        │
│  │Output:    │ │          │ │          │ │           │        │
│  │- Resumen  │ │Output:   │ │Output:   │ │Output:    │        │
│  │- Intent   │ │- Score   │ │- Etapa   │ │- Mensaje  │        │
│  │- Needs    │ │- Factores│ │- Cambio  │ │- Programa │        │
│  │- Object.  │ │          │ │          │ │           │        │
│  │- Sentim.  │ │          │ │          │ │           │        │
│  └───────────┘ └──────────┘ └──────────┘ └───────────┘        │
│                                                                 │
│  ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐        │
│  │RETARGETING│ │HOT LEAD  │ │DIRECTOR  │ │ QUERY     │        │
│  │           │ │DETECTOR  │ │COMERCIAL │ │ AGENT     │        │
│  │Trigger:   │ │          │ │          │ │           │        │
│  │FollowUp   │ │Trigger:  │ │Trigger:  │ │Trigger:   │        │
│  │agotado    │ │Score>90  │ │Cron      │ │User query │        │
│  │           │ │o listo_  │ │diario    │ │en chat IA │        │
│  │Output:    │ │cerrar    │ │          │ │           │        │
│  │- Nuevo    │ │          │ │Output:   │ │Output:    │        │
│  │  ángulo   │ │Output:   │ │- Resumen │ │- Respuesta│        │
│  │- Mensaje  │ │- Alerta  │ │- Alertas │ │  natural  │        │
│  │- Schedule │ │- Tarea   │ │- Recomen.│ │- Datos    │        │
│  │           │ │- Notif   │ │- Forecast│ │- Acciones │        │
│  └───────────┘ └──────────┘ └──────────┘ └───────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SERVICIOS COMPARTIDOS                        │   │
│  │                                                          │   │
│  │  Prompt Manager ─── Templates versionados por industria  │   │
│  │  Context Builder ── Construir contexto con datos del CRM │   │
│  │  Token Manager ──── Control de presupuesto de tokens     │   │
│  │  Response Cache ─── Cachear respuestas frecuentes        │   │
│  │  Guardrails ─────── Validar outputs, prevenir halluc.    │   │
│  │  Usage Meter ────── Registrar consumo por tenant         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 Pipeline de Procesamiento de Mensaje

```
Mensaje entrante
  │
  ▼
┌─────────────────────────────────────────────┐
│ 1. CONTEXT BUILDER                          │
│                                             │
│ Recopilar:                                  │
│ ├── Historial conversación (últimos N msgs) │
│ ├── Datos del lead (CRM memory)             │
│ ├── Configuración IA de la empresa          │
│ ├── Servicios/productos de la empresa       │
│ ├── Score actual y etapa                    │
│ └── Historial de followups/retargeting      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 2. PROMPT ASSEMBLY                          │
│                                             │
│ Template base (por industria)               │
│ + Contexto del lead                         │
│ + Instrucciones específicas                 │
│ + Output schema (JSON structured)           │
│ + Guardrails (restricciones)                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 3. OPENAI API CALL                          │
│                                             │
│ Model: gpt-4o-mini (análisis rutinario)     │
│        gpt-4o (scoring complejo, director)  │
│                                             │
│ Response format: JSON mode                  │
│ Temperature: 0.3 (análisis) / 0.7 (msgs)   │
│ Max tokens: budget controlado               │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 4. RESPONSE VALIDATION (Guardrails)         │
│                                             │
│ ├── Validar JSON schema                     │
│ ├── Verificar score en rango 0-100          │
│ ├── Verificar etapa es válida               │
│ ├── Sanitizar contenido (PII, etc.)         │
│ └── Fallback si respuesta inválida          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 5. PERSIST & TRIGGER                        │
│                                             │
│ ├── Actualizar ai_memory en lead            │
│ ├── Registrar ai_interaction                │
│ ├── Trigger: scoring → pipeline → hotlead   │
│ ├── Emitir eventos Realtime                 │
│ └── Actualizar métricas de uso              │
└─────────────────────────────────────────────┘
```

### 9.3 Estructura de Prompt (Ejemplo: Analyzer Agent)

```
SYSTEM:
Eres un analista comercial experto especializado en {industria}.
Tu tarea es analizar mensajes de prospectos y extraer información comercial.

CONTEXTO DE LA EMPRESA:
- Empresa: {company_name}
- Industria: {industry}
- Servicios: {services_list}
- Tono: {ai_tone}

CONTEXTO DEL LEAD:
- Nombre: {lead_name}
- Score actual: {current_score}
- Etapa actual: {current_stage}
- Resumen previo: {previous_summary}
- Objeciones previas: {previous_objections}
- Necesidades previas: {previous_needs}

HISTORIAL DE CONVERSACIÓN (últimos {N} mensajes):
{conversation_history}

NUEVO MENSAJE DEL PROSPECTO:
{new_message}

INSTRUCCIONES:
Analiza el mensaje y devuelve un JSON con la siguiente estructura:
{
  "resumen_inteligente": "resumen actualizado del prospecto",
  "nivel_interes": "alto|medio|bajo",
  "objeciones": ["lista de objeciones detectadas"],
  "necesidades": ["lista de necesidades expresadas"],
  "sentimiento": "positivo|neutral|negativo",
  "intencion": "comprar|informarse|comparar|quejar|otro",
  "score_delta": número entre -30 y +30,
  "etapa_sugerida": "contacto_inicial|interesado|seguimiento|caliente|listo_cerrar",
  "listo_cerrar": boolean,
  "proxima_accion": "acción recomendada para el vendedor",
  "urgencia": "alta|media|baja"
}

REGLAS:
- Sé preciso y conservador con el score
- No inventes información que no esté en el mensaje
- Basa tus conclusiones exclusivamente en los datos proporcionados
```

### 9.4 Modelo de Selección de AI Model

| Agente | Modelo Recomendado | Justificación |
|--------|-------------------|---------------|
| Analyzer | gpt-4o-mini | Alto volumen, bajo costo, suficiente calidad |
| Scoring | gpt-4o-mini | Cálculo estructurado, JSON mode |
| Pipeline | gpt-4o-mini | Decisión simple basada en reglas + contexto |
| FollowUp | gpt-4o | Generación de texto creativo personalizado |
| Retargeting | gpt-4o | Requiere creatividad y persuasión |
| Hot Lead | gpt-4o-mini | Detección binaria, bajo costo |
| Director | gpt-4o | Análisis complejo, resumen ejecutivo |
| Query | gpt-4o | Comprensión de lenguaje natural + SQL/datos |

### 9.5 Gestión de Costos IA

```
Estrategia de Token Budget por Plan:

STARTER:    50,000 tokens/mes   (~500 análisis de mensaje)
PRO:       200,000 tokens/mes   (~2,000 análisis)
ENTERPRISE: 1,000,000 tokens/mes (~10,000 análisis)

Optimizaciones:
├── Response caching (queries repetidas al Query Agent)
├── Batch processing (análisis en lotes en horas bajas)
├── Prompt compression (reducir tokens de contexto)
├── Modelo escalonado (mini para rutina, full para complejo)
├── Métricas de consumo visibles para el usuario
└── Alertas al 80% y 95% del presupuesto
```

---

## 10. ARQUITECTURA DE AUTOMATIZACIONES

### 10.1 Arquitectura n8n

```
┌─────────────────────────────────────────────────────────────┐
│                     n8n (Self-hosted / Cloud)                │
│                                                             │
│  WORKFLOWS POR CANAL                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WF-001: WhatsApp Inbound                            │   │
│  │ Trigger: Webhook (WhatsApp Business API)             │   │
│  │ → Validar mensaje → Resolver lead → Guardar mensaje  │   │
│  │ → Trigger IA Analyzer → Actualizar CRM               │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ WF-002: Facebook Messenger Inbound                   │   │
│  │ WF-003: Instagram DM Inbound                        │   │
│  │ WF-004: Telegram Inbound                             │   │
│  │ WF-005: Email Inbound                                │   │
│  │ WF-006: Webchat Inbound                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  WORKFLOWS DE IA                                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WF-010: FollowUp Scheduler                           │   │
│  │ Trigger: Cron (cada 1 hora)                          │   │
│  │ → Query leads con followup_pendiente = true          │   │
│  │ → Verificar fecha_followup <= now                    │   │
│  │ → Generar mensaje IA → Enviar por canal original     │   │
│  │ → Actualizar intentos_followup                       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ WF-011: Retargeting Scheduler                        │   │
│  │ Trigger: Cron (cada 24 horas)                        │   │
│  │ → Query leads con retargeting_pendiente = true       │   │
│  │ → Verificar fecha_retargeting <= now                 │   │
│  │ → Generar nuevo ángulo IA → Enviar                   │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ WF-012: Hot Lead Alert                               │   │
│  │ Trigger: Webhook (post-scoring)                      │   │
│  │ → Verificar score > threshold                        │   │
│  │ → Crear notificación app + WhatsApp + Tarea          │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ WF-013: Director Comercial Daily Briefing            │   │
│  │ Trigger: Cron (8:00 AM timezone empresa)             │   │
│  │ → Recopilar métricas del día anterior                │   │
│  │ → Generar resumen con IA                             │   │
│  │ → Guardar briefing → Notificar director/owner        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  WORKFLOWS DE NOTIFICACIÓN                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WF-020: Notification Dispatcher                      │   │
│  │ Trigger: Webhook (evento de notificación)            │   │
│  │ → Resolver preferencias del usuario                  │   │
│  │ → Enviar por canales configurados (app/WA/email)     │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │ WF-021: Task Overdue Alert                           │   │
│  │ Trigger: Cron (cada 1 hora)                          │   │
│  │ → Query tareas vencidas no completadas               │   │
│  │ → Notificar a asignado + supervisor                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  WORKFLOWS DE SISTEMA                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WF-030: Lead Assignment (Round Robin)                │   │
│  │ WF-031: Inactivity Detector                          │   │
│  │ WF-032: Weekly Report Generator                      │   │
│  │ WF-033: AI Usage Monitor                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Flujo de Eventos

```
EVENTO                          → WORKFLOW(S) ACTIVADO(S)
────────────────────────────────────────────────────────────
nuevo_mensaje_entrante           → WF-001/006 → WF-010 check
mensaje_analizado_ia             → WF-012 (hot lead check)
score_actualizado                → WF-012 (hot lead check)
lead_sin_respuesta_48h           → WF-010 (followup)
followup_agotado                 → WF-011 (retargeting)
tarea_vencida                    → WF-021 (alerta)
nuevo_dia_laboral                → WF-013 (briefing)
lead_creado                      → WF-030 (assignment)
notificacion_creada              → WF-020 (dispatch)
fin_de_semana                    → WF-032 (weekly report)
uso_ia_alto                      → WF-033 (alert)
```

### 10.3 Multi-tenancy en n8n

```
Estrategia: Workflows compartidos con datos por tenant

Cada webhook incluye company_id.
Cada workflow filtra por company_id.
Las credenciales de canales se obtienen de channel_lines (DB).
No se crean workflows por empresa — se reutilizan con parámetros.

Para Enterprise con alto volumen:
→ Instancias n8n dedicadas o workers separados
```

---

## 11. RIESGOS TÉCNICOS

### 11.1 Riesgos Críticos (Impacto Alto)

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|:----------:|:-------:|-----------|
| R1 | **Filtración de datos entre tenants** — Un error en RLS expone datos de una empresa a otra | Media | 🔴 Crítico | Tests automatizados de RLS en CI/CD. Auditoría periódica de policies. Pruebas de penetración. Never trust client-side filtering. |
| R2 | **Dependencia de OpenAI** — Cambio de precios, rate limits, downtime, deprecación de modelos | Alta | 🔴 Crítico | Abstraer capa de IA para swap de providers. Soporte multi-model (OpenAI, Anthropic, Google). Queue para reintentos. Caching agresivo. |
| R3 | **Compliance WhatsApp Business API** — Suspensión de cuenta por violar políticas de Meta | Alta | 🔴 Crítico | Opt-in explícito. Templates pre-aprobados para mensajes outbound. Rate limiting. Monitoreo de calidad de cuenta. Documentar consentimiento. |
| R4 | **Costos de IA no controlados** — Token consumption escalando con volumen de mensajes, erosionando márgenes | Alta | 🟠 Alto | Token budgets por plan. Medición granular. Modelos escalonados (mini vs full). Caching. Batch processing. Alertas de consumo. |
| R5 | **Performance de RLS a escala** — Queries lentas con muchas empresas y millones de filas | Media | 🟠 Alto | Índices compuestos en company_id. Particionamiento de tablas grandes. Connection pooling (PgBouncer). Monitoreo de query performance. |
| R6 | **Single Point of Failure — n8n** — Si n8n cae, todas las automatizaciones se detienen | Media | 🟠 Alto | n8n en alta disponibilidad (múltiples workers). Queue persistente (Redis/Bull). Healthchecks. Fallback manual para alertas críticas. |

### 11.2 Riesgos Moderados

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|:----------:|:-------:|-----------|
| R7 | **Hallucinations de IA** — Scoring o recomendaciones incorrectas dañan confianza del usuario | Media | 🟡 Medio | Guardrails estrictos. Validación de outputs. Flag de confianza. Permitir override manual. Feedback loop del usuario. |
| R8 | **Escalabilidad de WebSockets** — Supabase Realtime con miles de conexiones simultáneas | Media | 🟡 Medio | Limitar suscripciones por usuario. Fallback a polling. Plan de Supabase adecuado. CDN para assets. |
| R9 | **Complejidad de integraciones multi-canal** — Cada canal tiene APIs diferentes, rate limits, formatos | Alta | 🟡 Medio | Abstracción con interfaz común por canal. Adapters por canal. Testing exhaustivo. Documentación detallada. |
| R10 | **Regulaciones de privacidad LATAM** — LGPD (Brasil), Ley Federal de Datos (México), etc. | Media | 🟡 Medio | Data residency options. Consentimiento explícito. Políticas de retención. Derecho al olvido. Encriptación en reposo y tránsito. |
| R11 | **Onboarding friction** — Complejidad del sistema puede abrumar a nuevos usuarios | Alta | 🟡 Medio | Onboarding progresivo. Templates por industria. Wizard guiado. Empty states informativos. Video tours. |
| R12 | **Vendor lock-in con Supabase** — Difícil migrar si Supabase cambia pricing o features | Baja | 🟡 Medio | PostgreSQL estándar debajo. Abstraer Auth y Storage. Plan de contingencia documentado. |

### 11.3 Riesgos de Producto

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|:----------:|:-------:|-----------|
| R13 | **Feature creep** — Intentar competir con HubSpot/Salesforce desde el día 1 | Alta | 🟡 Medio | Roadmap disciplinado. MVP enfocado en IA + CRM + WhatsApp. Validar con usuarios antes de expandir. |
| R14 | **Pricing incorrecto** — Planes que no cubren costos de IA o no son competitivos | Media | 🟡 Medio | Unit economics detallados. Metering de uso real. Ajustar pricing con data. Modelo de tokens consumidos visible. |

---

## 12. OPORTUNIDADES DE ESCALABILIDAD

### 12.1 Escalabilidad Técnica

```
CORTO PLAZO (0-6 meses)
├── Supabase Connection Pooling (PgBouncer)
├── Índices optimizados en tablas de alto volumen
├── CDN para assets estáticos (Vercel Edge)
├── Response caching para IA (Redis)
└── Lazy loading de módulos en frontend

MEDIANO PLAZO (6-12 meses)
├── Particionamiento de tablas (messages, ai_interactions)
├── Read replicas para dashboards/reportes
├── Workers dedicados para n8n por volumen
├── Edge Functions con cold start optimization
├── WebSocket connection management mejorado
└── Background jobs con queue system (BullMQ/Inngest)

LARGO PLAZO (12-24 meses)
├── Microservicios para módulos de alto volumen (IA, Mensajería)
├── Multi-region deployment
├── Dedicated instances para Enterprise
├── Data warehouse para analytics avanzados
├── ML models propios (fine-tuned) para scoring por industria
└── API pública con rate limiting y monetización
```

### 12.2 Escalabilidad de Producto

```
EXPANSIONES NATURALES
├── 🌍 Internacionalización (i18n)
│   ├── Español (MX, CO, AR, CL, PE)
│   ├── Portugués (BR)
│   └── Inglés (US)
│
├── 🏭 Verticalización por Industria
│   ├── FAIREX para Clínicas (templates, workflows, campos)
│   ├── FAIREX para Inmobiliarias
│   ├── FAIREX para Agencias
│   ├── FAIREX para Seguros
│   └── FAIREX para Construcción
│
├── 🔌 Marketplace de Integraciones
│   ├── Zapier / Make integration
│   ├── Google Workspace
│   ├── Microsoft 365
│   ├── ERPs (SAP, Oracle, Odoo)
│   ├── Payment processors (Stripe, MercadoPago)
│   └── Contabilidad (QuickBooks, Contpaqi)
│
├── 📱 Apps Nativas
│   ├── iOS App (React Native o Swift)
│   ├── Android App
│   └── Desktop App (Electron, opcional)
│
├── 🤖 IA Avanzada
│   ├── Modelos fine-tuned por industria
│   ├── Predicción de revenue
│   ├── Análisis de sentimiento en tiempo real
│   ├── Generación automática de propuestas
│   ├── AI Voice Agent (llamadas automatizadas)
│   └── AI Video Agent (demos automatizadas)
│
└── 💰 Revenue Streams Adicionales
    ├── Marketplace de templates
    ├── Consultoría/Setup como servicio
    ├── White-label para agencias
    ├── API usage-based billing
    └── Add-ons premium (más tokens IA, más canales, etc.)
```

### 12.3 Métricas de Escalabilidad Target

| Fase | Empresas | Usuarios | Mensajes/día | AI Requests/día |
|------|----------|----------|-------------|----------------|
| MVP (Mes 3) | 10 | 50 | 1,000 | 500 |
| Growth (Mes 6) | 50 | 300 | 10,000 | 5,000 |
| Scale (Mes 12) | 200 | 1,500 | 50,000 | 25,000 |
| Enterprise (Mes 18) | 500 | 5,000 | 200,000 | 100,000 |
| Mature (Mes 24) | 1,000+ | 10,000+ | 500,000+ | 250,000+ |

---

## 13. ROADMAP DE PRODUCTO A 24 MESES

### Q1 — Meses 1-3: FOUNDATION

```
OBJETIVO: MVP funcional con CRM + WhatsApp + IA básica

Mes 1: Infraestructura
├── ☐ Setup proyecto Next.js + Tailwind + Framer Motion
├── ☐ Setup Supabase (Auth, DB, RLS, Storage)
├── ☐ Arquitectura multi-tenant (RLS policies)
├── ☐ Sistema de autenticación (login, registro, MFA)
├── ☐ Gestión de empresas y usuarios
├── ☐ Sistema de roles y permisos (RBAC)
├── ☐ Design system y componentes base
└── ☐ CI/CD pipeline

Mes 2: CRM Core + Conversaciones
├── ☐ Módulo de leads (CRUD, lista, detalle)
├── ☐ Centro de conversaciones (UI WhatsApp-like)
├── ☐ Integración WhatsApp Business API (1 línea)
├── ☐ Mensajería en tiempo real (Supabase Realtime)
├── ☐ Setup n8n + workflows base
├── ☐ Pipeline inteligente (Kanban)
├── ☐ Sistema de notificaciones básico
└── ☐ Empty states y onboarding

Mes 3: IA MVP
├── ☐ Agente Analizador de Conversaciones
├── ☐ Motor de Scoring (v1)
├── ☐ Agente de Pipeline (movimiento automático)
├── ☐ Memoria CRM inteligente (ai_memory)
├── ☐ Panel de análisis IA en conversaciones
├── ☐ Dashboard ejecutivo básico
├── ☐ Dashboard de vendedor básico
└── ☐ Testing end-to-end + Beta privada
```

### Q2 — Meses 4-6: INTELLIGENCE

```
OBJETIVO: IA completa + Automatizaciones + Multi-canal

Mes 4: FollowUp + Retargeting
├── ☐ FollowUp IA (programación, personalización, intentos)
├── ☐ Retargeting IA (reactivación, nuevo ángulo)
├── ☐ Sistema de tareas (manual + auto-generadas)
├── ☐ Calendario inteligente (v1)
├── ☐ Configuración de scoring personalizable
└── ☐ Gamificación vendedores (ranking, rachas)

Mes 5: Director Comercial IA
├── ☐ Hot Lead Detector + alertas
├── ☐ Director Comercial IA (briefing diario)
├── ☐ IA Comercial (Query Agent — chat)
├── ☐ Insights automatizados
├── ☐ Reportes de ventas (v1)
└── ☐ Reportes de equipo

Mes 6: Multi-canal + Polish
├── ☐ Facebook Messenger integration
├── ☐ Instagram DM integration
├── ☐ Telegram integration
├── ☐ Email inbound integration
├── ☐ Webchat embeddable widget
├── ☐ WhatsApp multi-línea
├── ☐ Configuración avanzada de IA
├── ☐ Campos personalizados
└── ☐ Lanzamiento público v1.0
```

### Q3 — Meses 7-9: GROWTH

```
OBJETIVO: Escalar producto + Marketing Intelligence + Billing

Mes 7: Billing + Self-service
├── ☐ Integración Stripe (planes, suscripciones)
├── ☐ Gestión de planes (Starter/Pro/Enterprise)
├── ☐ Feature flags por plan
├── ☐ AI usage metering y alertas
├── ☐ Onboarding mejorado con templates por industria
└── ☐ Admin panel FAIREX (gestión de tenants)

Mes 8: Marketing Intelligence v1
├── ☐ Conexión Meta Ads API
├── ☐ Métricas: CPL, CPA, ROAS, ROI
├── ☐ Atribución de leads por fuente
├── ☐ UTM tracking
├── ☐ Reportes de marketing
└── ☐ Google Ads integration

Mes 9: Advanced Features
├── ☐ Reportes personalizados
├── ☐ Exportación avanzada (PDF, Excel)
├── ☐ Audit log (historial de actividad)
├── ☐ API pública v1 (read-only)
├── ☐ Webhooks salientes
├── ☐ Calendario: sync Google Calendar / Outlook
└── ☐ PWA optimizada para mobile
```

### Q4 — Meses 10-12: SCALE

```
OBJETIVO: Enterprise features + Performance + Mobile

Mes 10: Enterprise
├── ☐ SSO/SAML (Google Workspace, Azure AD)
├── ☐ Equipos y jerarquías organizacionales
├── ☐ Permisos personalizados
├── ☐ Dedicated instances (Enterprise plan)
├── ☐ SLA monitoring
└── ☐ Advanced security (IP whitelisting, 2FA enforce)

Mes 11: Performance + AI v2
├── ☐ Particionamiento de tablas
├── ☐ Read replicas para analytics
├── ☐ Response caching (Redis)
├── ☐ AI model fine-tuning por industria (v1)
├── ☐ Scoring v2 (ML-enhanced)
└── ☐ Revenue forecasting

Mes 12: Mobile + Review
├── ☐ Mobile app (React Native) — v1
├── ☐ Push notifications nativas
├── ☐ Offline mode básico
├── ☐ Performance audit completo
├── ☐ Security audit
└── ☐ Product review annual → plan Year 2
```

### Q5-Q6 — Meses 13-18: PLATFORM

```
OBJETIVO: Convertirse en plataforma con marketplace

├── ☐ Visual automation builder (workflow designer)
├── ☐ Email marketing (sequences, templates, campaigns)
├── ☐ SMS marketing integration
├── ☐ Propuestas y cotizaciones (document generator)
├── ☐ Productos/servicios catálogo
├── ☐ TikTok Ads integration
├── ☐ Marketplace de integraciones (v1)
├── ☐ Zapier / Make connectors
├── ☐ i18n: Portugués (Brasil)
├── ☐ Verticalización: templates por industria
├── ☐ Customer portal (vista cliente)
├── ☐ White-label (para agencias)
├── ☐ API pública v2 (CRUD completo)
└── ☐ Advanced AI: Generación automática de propuestas
```

### Q7-Q8 — Meses 19-24: ENTERPRISE+

```
OBJETIVO: IA empresarial integral + Expansión

├── ☐ AI Voice Agent (llamadas automatizadas)
├── ☐ Predictive analytics avanzado
├── ☐ Custom objects (entidades personalizadas)
├── ☐ Data warehouse + BI integrado
├── ☐ ERP integrations (SAP, Oracle, Odoo)
├── ☐ Payment processing (MercadoPago, Stripe)
├── ☐ Advanced workflow conditions
├── ☐ Multi-region deployment (latency optimization)
├── ☐ SOC 2 compliance (si target enterprise)
├── ☐ Knowledge base / Help desk module
├── ☐ i18n: Inglés
├── ☐ Desktop app (opcional)
├── ☐ Community / Academy
└── ☐ Series A preparation metrics
```

---

## 14. GAP ANALYSIS VS COMPETIDORES ENTERPRISE

### Funcionalidades Críticas Faltantes

A continuación se identifican las **27 funcionalidades críticas** que FAIREX necesita para competir con HubSpot, Salesforce y GoHighLevel:

### 14.1 Gaps de Alta Prioridad (Necesarios para v1-v2)

| # | Funcionalidad | HubSpot | Salesforce | GoHighLevel | FAIREX (Actual) | Impacto |
|---|--------------|:-------:|:----------:|:-----------:|:---------------:|:-------:|
| G1 | **Formularios de captura web** | ✅ | ✅ | ✅ | ❌ | 🔴 Crítico |
| G2 | **Landing pages builder** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G3 | **Email marketing (campañas)** | ✅ | ✅ | ✅ | ❌ | 🔴 Crítico |
| G4 | **Secuencias/cadencias multi-paso** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G5 | **Propuestas y cotizaciones** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G6 | **Catálogo de productos/servicios** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G7 | **Importación/exportación de datos** | ✅ | ✅ | ✅ | ❌ (plan) | 🔴 Crítico |
| G8 | **Campos personalizados** | ✅ | ✅ | ✅ | ❌ (plan) | 🔴 Crítico |
| G9 | **API pública documentada** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G10 | **Webhook outbound** | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |

### 14.2 Gaps de Media Prioridad (v2-v3)

| # | Funcionalidad | HubSpot | Salesforce | GoHighLevel | FAIREX (Actual) | Impacto |
|---|--------------|:-------:|:----------:|:-----------:|:---------------:|:-------:|
| G11 | **Visual workflow/automation builder** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G12 | **SMS marketing** | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |
| G13 | **VoIP / Call tracking** | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |
| G14 | **Deal/Opportunity management** (valor monetario) | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G15 | **Revenue forecasting** | ✅ | ✅ | ❌ | ❌ | 🟡 Medio |
| G16 | **Mobile app nativa** | ✅ | ✅ | ✅ | ❌ | 🟠 Alto |
| G17 | **SSO/SAML** | ✅ | ✅ | ❌ | ❌ | 🟡 Medio |
| G18 | **Audit trail completo** | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |

### 14.3 Gaps de Baja Prioridad (v3-v4)

| # | Funcionalidad | HubSpot | Salesforce | GoHighLevel | FAIREX (Actual) | Impacto |
|---|--------------|:-------:|:----------:|:-----------:|:---------------:|:-------:|
| G19 | **Knowledge base / Help desk** | ✅ | ✅ | ❌ | ❌ | 🟡 Medio |
| G20 | **Customer portal** | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |
| G21 | **Custom report builder** | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |
| G22 | **White-label** | ❌ | ✅ | ✅ | ❌ | 🟡 Medio |
| G23 | **Marketplace de apps** | ✅ | ✅ | ❌ | ❌ | 🟡 Medio |
| G24 | **A/B testing** (emails, landing) | ✅ | ✅ | ✅ | ❌ | 🟡 Medio |
| G25 | **Territories/territory management** | ❌ | ✅ | ❌ | ❌ | ⚪ Bajo |
| G26 | **Contract management** | ✅ | ✅ | ❌ | ❌ | ⚪ Bajo |
| G27 | **Community/academy** | ✅ | ✅ | ✅ | ❌ | ⚪ Bajo |

### 14.4 Ventajas Competitivas de FAIREX (vs Competidores)

> [!IMPORTANT]
> FAIREX no debe intentar replicar todo lo que tienen HubSpot/Salesforce. Su ventaja está en la **IA nativa integrada profundamente** en cada flujo, algo que los competidores están agregando como capa superficial.

| Ventaja | HubSpot | Salesforce | GoHighLevel | FAIREX |
|---------|:-------:|:----------:|:-----------:|:------:|
| **IA que analiza cada conversación automáticamente** | ❌ | ❌ (parcial) | ❌ | ✅ |
| **Scoring automático por IA de conversaciones** | ❌ | ❌ | ❌ | ✅ |
| **FollowUp IA personalizado** | ❌ | ❌ | ❌ | ✅ |
| **Retargeting IA con nuevo ángulo** | ❌ | ❌ | ❌ | ✅ |
| **Director Comercial IA (briefing diario)** | ❌ | ❌ | ❌ | ✅ |
| **Pipeline movido por IA** | ❌ | ❌ | ❌ | ✅ |
| **Consulta en lenguaje natural a datos** | Parcial | Einstein (caro) | ❌ | ✅ |
| **Precio accesible para LATAM** | ❌ ($$$) | ❌ ($$$$) | Parcial | ✅ |
| **WhatsApp-first (crucial en LATAM)** | Parcial | Parcial | Parcial | ✅ |
| **UX simplificada vs. Enterprise bloat** | ❌ | ❌ | Parcial | ✅ |

### 14.5 Estrategia de Priorización de Gaps

```
MUST HAVE para v1.0 (Mes 6):
  G7  — Import/Export de datos
  G8  — Campos personalizados
  G14 — Deal management (valor en pipeline)

MUST HAVE para v1.5 (Mes 9):
  G1  — Formularios de captura web
  G9  — API pública v1
  G10 — Webhooks outbound

SHOULD HAVE para v2.0 (Mes 12):
  G3  — Email marketing básico
  G4  — Secuencias multi-paso
  G5  — Propuestas/cotizaciones
  G6  — Catálogo de servicios
  G16 — Mobile app v1

NICE TO HAVE para v3.0 (Mes 18):
  G2  — Landing page builder
  G11 — Visual automation builder
  G12 — SMS
  G22 — White-label

LONG TERM (Mes 24+):
  Resto de gaps (G13, G15, G17-G21, G23-G27)
```

---

## CONCLUSIÓN

FAIREX AI BUSINESS OS tiene una propuesta de valor **excepcionalmente fuerte**: ser el primer Business OS donde la IA no es un add-on sino el **sistema nervioso central** de la operación comercial. 

El diferenciador principal — una IA que analiza, decide y ejecuta acciones comerciales automáticamente sobre cada conversación — **no existe en ningún competidor actual** con la profundidad que propone FAIREX.

Los riesgos principales son:
1. Controlar costos de IA por tenant
2. Cumplimiento de WhatsApp Business API
3. No caer en feature creep intentando competir con HubSpot/Salesforce en todo

La recomendación estratégica es: **lanzar con un MVP extremadamente enfocado en WhatsApp + CRM + IA** (Fase 1) y expandir basándose en feedback real de usuarios pagados.

---

*Documento generado como CTO Enterprise · Product Manager · Arquitecto SaaS · Arquitecto IA · UX Architect*
