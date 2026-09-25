---
title: "14 - Glosario y mantenimiento"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 14 - Glosario y mantenimiento

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Glosario

| Término | Significado en el MVP |
|---|---|
| Tambor | Unidad física cuyo contenido y recorrido se registra. |
| ID técnico | Identificador interno del registro, usado en rutas y persistencia. |
| Número de tambor | Código visible secuencial como `T000001`. |
| Código descriptivo | Combinación de características del producto. |
| Código completo | Código descriptivo más número del tambor. |
| CODE 128 | Formato de barras que representa el código completo. |
| Catálogo | Conjunto de opciones administrables para un campo. |
| Lote | Identificación del lote que informa la empresa. |
| Movimiento | Registro de una acción que puede cambiar ubicación/estado. |
| Historial | Secuencia de eventos y cambios por tambor. |
| MVP | Versión mínima para comprobar el circuito de trabajo con usuarios. |
| Demo local | Datos almacenados en el navegador actual para pruebas. |
| Piloto | Prueba acotada en la empresa con condiciones y responsables definidos. |
| Transacción | Operación que garantiza que un conjunto de escrituras se confirma o revierte como unidad. |
| Idempotencia | Repetir una solicitud sin duplicar su efecto. |

## Mantener la documentación

1. Revisar [[Olivícola Luján/10 - Estado actual y validación|10 - Estado actual y validación]] después de cada cambio verificable.
2. Actualizar [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]] cuando una tarea termine, indicando su evidencia.
3. Registrar decisiones y supuestos en [[Olivícola Luján/13 - Decisiones y preguntas abiertas|13 - Decisiones y preguntas abiertas]].
4. Actualizar los manuales si cambian textos o pasos de la interfaz.
5. Cambiar `actualizado` en el encabezado de cada nota modificada.
6. Comprobar que los enlaces del índice siguen resolviendo.

Las notas usan enlaces completos desde la raíz de la bóveda (`Olivícola Luján/...`) para evitar colisiones con documentos de otros proyectos. No requieren plugins de Obsidian; los diagramas están en Mermaid.

## Fuentes y precedencia

La especificación original se conserva en [[Olivícola Luján/99 - Especificación original|99 - Especificación original]]. La aclaración posterior del usuario confirma el enfoque de MVP para una empresa con datos reales. El código local determina el estado implementado; las ejecuciones de pruebas determinan lo verificado. Una intención del documento original no debe convertirse en una afirmación de funcionalidad terminada.

## Copias

Esta sección existe en la bóveda y tiene una copia en `docs/obsidian/` del proyecto. No hay sincronización automática entre ambas ubicaciones. Mantenerlas alineadas de manera consciente y evitar sobrescribir cambios manuales sin revisión.

## Información que no debe guardarse aquí

Contraseñas, tokens, credenciales de servicio y datos operativos sensibles ajenos al propósito de la documentación. Estos documentos describen la aplicación; no reemplazan la base de datos ni un sistema de copias de seguridad.
