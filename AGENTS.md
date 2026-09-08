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

<!-- BEGIN:fairex-production-safety-rules -->
# SALVAGUARDAS OPERATIVAS - FAIREX Business OS

Estas reglas complementan las reglas inamovibles existentes y no las reemplazan.

## 1. Seguridad multiempresa

1. Toda funcionalidad que maneje datos de clientes debe preservar estrictamente el aislamiento multiempresa.
2. `company_id` debe provenir del contexto autenticado, de una integración resuelta o de la fuente autorizada correspondiente.
3. Nunca hardcodear `company_id`.
4. Nunca utilizar `company_id = 1` ni otro tenant fijo como fallback.
5. Nunca permitir que el cliente, usuario final, payload externo o LLM elija arbitrariamente el tenant.
6. Las consultas multiempresa deben incluir filtros explícitos de tenant cuando corresponda, además de estar protegidas mediante RLS.
7. Antes de cerrar cualquier cambio relacionado con datos, evaluar y reportar el riesgo de acceso o fuga cross-tenant.

## 2. Supabase y RLS

1. Supabase continúa siendo la única fuente de verdad.
2. El Dashboard del Cliente debe acceder a Supabase mediante un cliente autenticado y quedar protegido por RLS.
3. `service_role` debe utilizarse únicamente en contextos server, admin o internos, y solo cuando su uso esté expresamente justificado.
4. Nunca exponer `service_role` al navegador, cliente, usuario final o LLM.
5. No modificar RLS, grants, políticas, tablas o constraints sin auditoría previa y autorización explícita.
6. No ejecutar SQL destructivo.
7. No ejecutar `DELETE`, `DROP`, `TRUNCATE`, resets de datos o migraciones destructivas sin autorización explícita.
8. Todo SQL nuevo debe seguir siendo idempotente y toda migración debe poder ejecutarse varias veces sin errores.

## 3. Git y protección del repositorio

1. Antes de cualquier implementación, ejecutar y revisar:

   ```bash
   git status --short
   git diff --stat
   git diff
   ```

2. Preservar todo trabajo local existente, aunque no forme parte de la tarea actual.
3. Nunca descartar, sobrescribir ni revertir trabajo existente sin autorización explícita.
4. Nunca ejecutar automáticamente las siguientes operaciones si pueden afectar trabajo existente:

   ```text
   git reset
   git restore
   git clean
   git checkout sobre archivos modificados
   git rebase
   git merge
   ```

5. No ejecutar `git commit` ni `git push` sin autorización explícita del usuario.

## 4. GitHub, Vercel y producción

1. No modificar GitHub, Vercel, variables de entorno ni ningún entorno de producción sin autorización explícita.
2. No crear, cerrar, fusionar ni modificar pull requests, branches, releases, deployments o configuraciones remotas sin autorización explícita.
3. No realizar deploy automáticamente.
4. Todo cambio local debe validarse antes de autorizar o efectuar su publicación.

## 5. Cambios incrementales y control de alcance

1. Evitar refactors amplios cuando una modificación localizada resuelva el problema.
2. No reescribir módulos completos sin una necesidad técnica demostrable.
3. No ampliar el scope de una fase o tarea sin autorización.
4. Si durante una tarea se descubre una mejora no bloqueante, reportarla como backlog en lugar de implementarla automáticamente.
5. Reutilizar actions, tipos, componentes y patrones existentes antes de crear alternativas nuevas.

## 6. n8n

1. No modificar workflows de n8n por inferencia basada únicamente en el repositorio.
2. Todo cambio de n8n requiere auditar previamente el workflow real y obtener autorización explícita.
3. Nunca hardcodear tenants, números de WhatsApp o integraciones específicas cuando exista o deba utilizarse una resolución dinámica.
4. n8n continúa limitado a la ejecución de automatizaciones e IA y nunca debe convertirse en fuente principal de datos.

## 7. Validaciones

1. Después de una implementación de código, cuando corresponda, ejecutar y revisar:

   ```bash
   npx tsc --noEmit
   npm run build
   git diff --stat
   git status --short
   ```

2. No considerar una fase terminada solamente porque el código compila.
3. Las funcionalidades críticas deben incluir también pruebas funcionales o manuales cuando corresponda.
4. Si alguna validación no puede ejecutarse o falla, reportarlo expresamente junto con la causa conocida y el riesgo pendiente.

## 8. Continuidad entre agentes y modelos

1. Si existe trabajo iniciado por otro agente o modelo, inspeccionar primero el estado real del repositorio.
2. Nunca reiniciar una implementación únicamente porque cambió el agente o modelo.
3. Preservar los cambios locales válidos y continuar incrementalmente desde el estado existente.
4. No asumir que una tarea está incompleta, terminada o limpia sin verificar el repositorio y la evidencia disponible.

## 9. Fuente de verdad y arquitectura

1. Mantener todas las reglas arquitectónicas existentes de este `AGENTS.md`.
2. No introducir una segunda fuente de verdad cuando ya exista una capa estable.
3. Supabase permanece como fuente de verdad, Next.js como Backend For Frontend y n8n como ejecutor de automatizaciones e IA.
4. Reutilizar las capas, actions, tipos, componentes, integraciones y patrones existentes antes de crear alternativas nuevas.
5. Toda integración nueva debe continuar desacoplada mediante `company_integrations` y `company_modules`.

## 10. Secretos y credenciales

1. Nunca exponer, imprimir, copiar ni incluir en reportes secretos, tokens, API keys, passwords, credenciales, service role keys o valores sensibles de variables de entorno.
2. No modificar archivos `.env`, `.env.local`, variables de entorno de Vercel, credenciales de Supabase, n8n, YCloud u otros proveedores sin autorización explícita.
3. Si una tarea requiere una credencial, reportar que es necesaria sin revelar valores existentes.
4. Nunca trasladar secretos al código fuente, logs, prompts, commits o archivos versionados.

## 11. Dependencias y herramientas

1. No instalar, actualizar, eliminar ni reemplazar dependencias sin autorización explícita.
2. No modificar `package.json`, archivos lock o configuración del package manager salvo que la tarea autorizada lo requiera expresamente.
3. No ejecutar automáticamente comandos como `npm audit fix`, `npm audit fix --force`, upgrades masivos o migraciones automáticas de dependencias.
4. Si se detecta una dependencia obsoleta o vulnerable que no bloquee la tarea actual, reportarla como riesgo o backlog en lugar de modificarla automáticamente.
<!-- END:fairex-production-safety-rules -->
