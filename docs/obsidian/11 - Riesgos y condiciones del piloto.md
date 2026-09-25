---
title: "11 - Riesgos y condiciones del piloto"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 11 - Riesgos y condiciones del piloto

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Condición de uso actual

El MVP sirve como base para probar el flujo. El modo demo no es un inventario compartido, y la rama remota todavía no tiene conexión ni garantías de producción verificadas. La empresa debe poder diferenciar datos de práctica de su inventario oficial.

## Riesgos concretos observados

| Riesgo | Situación actual | Trabajo necesario |
|---|---|---|
| Dos tambores con igual número | `max + 1` se calcula en cada cliente remoto. | Asignación central y restricción de unicidad verificadas con concurrencia. |
| Operación incompleta | Tambor, Movimiento e Historial se escriben en llamadas independientes. | Flujo de servidor consistente, idempotencia y recuperación probada. |
| Historial modificable | Los esquemas no incluyen políticas de acceso. | Configurar y probar permisos de creación, lectura y modificación. |
| Acción no autorizada | El rol no restringe acciones de la interfaz ni define reglas de servidor. | Matriz de permisos y enforcement en backend. |
| Pérdida local | localStorage se pierde al limpiar el sitio/perfil. | Respaldo, recuperación y almacenamiento compartido para operación oficial. |
| Mezcla de ejemplos y datos propios | No hay espacio separado todavía. | Separar contextos y señalar claramente el activo. |
| Etiqueta anterior no resuelve | El código cambia y no se guardan alias. | Política de reimpresión o búsqueda por código histórico. |
| Historia incompleta | Alta y eliminación no guardan ficha completa. | Snapshots suficientes para reconstrucción y revisión histórica. |
| Nombres históricos cambian | El historial resuelve referencias contra catálogos actuales. | Guardar valor legible histórico o versionar catálogos. |
| Eliminación no restaurable | No hay papelera ni restauración. | Restringir acceso y acordar política con la empresa. |
| Datos desactualizados | No hay actualizaciones en tiempo real ni control de versión. | Refresco y detección de conflictos según volumen real. |
| Inventario grande | Las cuatro entidades se cargan completas en memoria. | Filtrado/paginación del lado servidor cuando sea necesario. |

## Acceso a Base44

Proteger una ruta React no protege por sí solo los datos. Es necesario configurar y probar las autorizaciones en Base44. Los controles de validación del cliente pueden ser omitidos por otro cliente; las reglas esenciales deben ser comprobadas por el backend.

## Antes de usar datos oficiales

- [ ] Entorno de la empresa identificado y acceso probado.
- [ ] Catálogos aprobados por el responsable de planta.
- [ ] Roles y permisos definidos y verificados.
- [ ] Identificación única bajo concurrencia.
- [ ] Operaciones parciales controladas y recuperables.
- [ ] Copia de seguridad y restauración probadas.
- [ ] Separación de ejemplos y datos oficiales.
- [ ] Etiqueta física escaneada correctamente.
- [ ] Operarios completan el circuito básico.
- [ ] Responsable y procedimiento de incidencias acordados.

Estos puntos son condiciones técnicas propuestas para el piloto, no certificaciones, exigencias legales ni evidencias de que ya fueron cumplidos.
