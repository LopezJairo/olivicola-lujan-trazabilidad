---
title: "11 - Riesgos y condiciones del piloto"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - riesgos
  - piloto
  - contingencia
---

# 11 - Riesgos y condiciones del piloto

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Matriz de Riesgos Identificados y Mitigaciones Implementadas

Durante el ciclo de desarrollo y pruebas se resolvieron los principales riesgos operativos y de arquitectura:

| Riesgo Técnico / Operativo | Impacto Potencial | Mitigación Implementada en v1.0.6 | Estado |
|---|---|---|---|
| **Salto de Rol no autorizado por Operarios** | Operarios mutando a administradores para cambiar claves o permisos. | En v1.0.6 se inhabilitó la conmutación de rol a nivel de contexto y backend, y se ocultaron 100% las secciones de gestión de personal y jerarquías del DOM de operarios. | ✅ Mitigado y Verificado por Tests |
| **Colisión de IDs por altas simultáneas** | Dos computadoras generando el mismo número de tambor. | El cálculo de `nextTamborId` se centraliza y el backend SQLite en la máquina Host asegura la atomicidad y unicidad secuencial de registros. | ✅ Mitigado |
| **Caída de Red Local (LAN)** | Pérdida de comunicación entre terminales y el servidor. | Las terminales disponen de modo autónomo con respaldo local y reconexión automática con sincronización de estado una vez restaurada la red. | ✅ Mitigado |
| **Desfasaje o atasco de etiquetas térmicas** | Desperdicio de insumos en la Zebra GC420t. | Reglas CSS `@page { size: 100mm 50mm; margin: 0; }` calibradas a sangre y generación nativa de ZPL II con coordenadas exactas en 203 dpi (800x400 dots). | ✅ Mitigado y Probado |
| **Pérdida de caracteres en escaneos rápidos** | El lector HPRT enviando ráfagas de memoria más rápido que la interfaz. | Buffer de entrada con debounce y procesamiento masivo por lotes en `/inventario/toma`. | ✅ Mitigado |
| **Pérdida de datos por falla de hardware** | Rotura de disco de la PC de Balanza. | Exportación en 1 clic de respaldo completo JSON desde Configuración y persistencia estándar en SQLite `data/olivicola.db`. | ✅ Mitigado |

---

## Lista de Verificación para el Piloto en Planta

Antes de declarar formalmente el sistema en régimen operativo definitivo, se sugiere cumplir los siguientes pasos físicos:

1. [x] **Compilación y verificación de ejecutables:** Versión v1.0.6 generada y probada.
2. [x] **Configuración de seguridad:** Contraseñas iniciales asignadas y clave maestra de gerencia protegida.
3. [x] **Catálogos cargados:** 100% de productos, presentaciones, variedades y calibres alineados con el Excel de Gerencia.
4. [ ] **Prueba de hardware en banco:** Conectar la Zebra GC420t en la Balanza de Entrada e imprimir un rollo de 10 etiquetas de prueba a 100 mm × 50 mm.
5. [ ] **Verificación de lectura óptica:** Escanear las etiquetas impresas con el lector HPRT N130BT a 20-30 cm de distancia bajo la luz real del galpón.
6. [ ] **Prueba de estiba y memoria:** Realizar una toma de inventario simulada en la Fila 1 de la Nave A con el lector en modo memoria y volcarla en la app.
7. [ ] **Capacitación básica de operarios:** Explicar el inicio con legajo, atajos 1-7 y confirmación de pesaje (menos de 15 minutos por turno).
8. [ ] **Rutina de respaldo:** Designar al encargado de descargar la copia de seguridad JSON al terminar cada jornada de producción.
