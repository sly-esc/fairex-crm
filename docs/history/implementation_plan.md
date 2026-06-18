# Plan de Auditoría UX y Botones Huerfanos (Cierre Fase 1)

Para asegurar que el prototipo sea coherente y ningún botón parezca "roto", propongo la siguiente auditoría de comportamiento para todos los elementos accionables actuales. 

Para las acciones no esenciales en la Fase 1, instalaremos el componente `sonner` (Toasts de Shadcn) para mostrar notificaciones elegantes de "Próximamente". Para otras, añadiremos interacción mock.

## Opciones Propuestas por Módulo

### 1. Conversaciones (`/conversaciones`)
* **Llamada / Videollamada (Header)**: Mostrar Toast *"Próximamente: Integración con VoIP y Zoom"*.
* **Opciones (`...`)**: Mostrar Menú Dropdown con opciones "Exportar historial" y "Silenciar". Al clicar -> Toast *"Próximamente"*.
* **Toggle Intervención (IA / Humano)**: Hacerlo **100% funcional a nivel visual**. Al cambiarlo, el header indicará "IA Pausada - Agente Humano al mando".
* **Adjuntar Archivos / Emojis**: Mostrar Toast *"Próximamente"*.
* **Enviar Mensaje**: Hacerlo **100% funcional localmente**. Al escribir y presionar Enter/Enviar, el mensaje aparecerá en el historial de ese Lead simulando la conversación.

### 2. Perfil CRM (`/leads/[id]`)
* **Acciones rápidas (Llamar, Enviar Correo)**: Mostrar Toast indicando *"Se abrirá cliente de correo / teléfono"*.
* **Generar Propuesta IA (Botón Mágico)**: Mostrar un Toast dinámico: *"Generando propuesta..."* seguido de *"Propuesta creada con éxito"* (Próximamente).
* **Opciones de edición**: Mostrar Toast *"Próximamente: Panel de edición"*.

### 3. Pipeline de Ventas (`/pipeline`)
* **Botón Filtros**: Mostrar Dropdown visual estático simulando opciones (Por Fecha, Por Origen).
* **Opciones de Tarjeta (`...`)**: Mostrar Dropdown con "Editar" y "Eliminar". Al clicar -> Toast *"Próximamente"*.

### 4. Directorio de Leads (`/leads`)
* **Botón Filtros**: Mostrar Dropdown visual estático igual que en Pipeline.

### 5. Navegación Global (Header y Sidebar)
* **Perfil de Usuario (Dropdown)**: 
  * "Perfil" / "Soporte" -> Toast *"Próximamente: Panel de cuenta"*.
  * "Cerrar Sesión" -> Toast *"Simulando cierre de sesión..."*.
* **Menú Configuración (Sidebar)**: Mostrar Toast *"Próximamente: Módulo de ajustes corporativos"* y evitar que la página devuelva 404.

---

> [!IMPORTANT]
> **Pregunta Abierta para ti:**
> 1. ¿Estás de acuerdo con utilizar Toasts flotantes ("Próximamente") para las integraciones futuras en lugar de deshabilitar los botones visualmente?
> 2. ¿Deseas que implementemos alguna de estas acciones de forma más profunda (ej. un modal de edición falso) o este nivel de feedback es suficiente para cerrar la Fase 1?
