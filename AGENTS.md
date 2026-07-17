<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:fairex-business-os-rules -->
# REGLAS INAMOVIBLES - FAIREX Business OS

1. Nunca rompas funcionalidades existentes.
2. Nunca modifiques un flujo de n8n en producción de forma destructiva.
3. Toda modificación debe ser incremental.
4. Nunca reemplaces componentes existentes cuando puedas extenderlos.
5. Nunca elimines tablas existentes sin autorización explícita.
6. Nunca modifiques RLS existente sin una auditoría previa.
7. Nunca cambies estructuras del Dashboard del Cliente sin autorización.
8. Todo desarrollo nuevo debe ser desacoplado.
9. Todo código nuevo debe ser TypeScript estricto.
10. Todo SQL debe ser idempotente.
11. Toda migración debe poder ejecutarse varias veces sin errores.
12. Antes de generar código:
    * audita
    * explica impacto
    * identifica riesgos
    * propone plan
13. Después de generar código:
    * explica exactamente qué cambió
    * qué archivos tocó
    * qué riesgo existe
    * cómo validar
    * qué quedó pendiente
14. Si detectas una mejora arquitectónica importante:
    NO la implementes automáticamente.
    Primero preséntala para aprobación.
15. Si existe alguna duda, prioriza estabilidad sobre velocidad.
16. FAIREX Business OS es una plataforma SaaS Multiempresa.
    Toda decisión debe pensar en cientos o miles de empresas funcionando simultáneamente.
17. Supabase es la única fuente de verdad.
18. Next.js es el Backend For Frontend.
19. n8n únicamente ejecuta automatizaciones e IA.
    Nunca debe convertirse en la fuente principal de datos.
20. Toda nueva integración debe ser desacoplada mediante company_integrations y company_modules.
<!-- END:fairex-business-os-rules -->
