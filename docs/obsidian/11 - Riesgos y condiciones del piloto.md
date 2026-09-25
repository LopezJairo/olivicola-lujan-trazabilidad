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

El MVP sirve como base para probar el flujo. El modo local no es un inventario compartido entre múltiples puestos de trabajo. La empresa debe poder diferenciar datos de práctica de su inventario oficial.

## Riesgos concretos observados

| Riesgo | Situación actual | Trabajo necesario |
|---|---|---|
| Dos tambores con igual número | `max + 1` se calcula localmente en el cliente. | Asignación central y restricción de unicidad verificadas con concurrencia. |
| Operación incompleta | Tambor, Movimiento e Historial se escriben en el almacenamiento del navegador. | Flujo de servidor consistente, idempotencia y recuperación probada si se centraliza. |
| Historial modificable | Las escrituras operan a nivel de cliente. | Configurar y probar permisos de creación, lectura y modificación en servidor central. |
| Acción no autorizada | El rol no restringe acciones críticas en la interfaz. | Matriz de permisos y enforcement. |
| Pérdida local | localStorage se pierde al limpiar el sitio/perfil. | Respaldo, recuperación y almacenamiento compartido para operación oficial. |
| Mezcla de ejemplos y datos propios | Espacio demo y espacio empresa disponibles localmente. | Separar contextos y señalar claramente el activo. |
| Etiqueta anterior no resuelve | El código cambia y no se guardan alias. | Política de reimpresión o búsqueda por código histórico. |
| Historia incompleta | Alta y eliminación no guardan ficha completa. | Snapshots suficientes para reconstrucción y revisión histórica. |
| Nombres históricos cambian | El historial resuelve referencias contra catálogos actuales. | Guardar valor legible histórico o versionar catálogos. |
| Eliminación no restaurable | No hay papelera ni restauración. | Restringir acceso y acordar política con la empresa. |
| Datos desactualizados | No hay actualizaciones en tiempo real ni control de versión. | Refresco y detección de conflictos según volumen real. |
| Inventario grande | Las cuatro entidades se cargan completas en memoria. | Filtrado/paginación del lado servidor cuando sea necesario. |

## Seguridad y control de acceso

Proteger una ruta React no protege por sí solo los datos si se expone una base de datos centralizada. En caso de desplegar un backend distribuido, las reglas esenciales de validación y autorización deben ser comprobadas por el servidor.

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
