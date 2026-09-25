---
title: "13 - Decisiones y preguntas abiertas"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 13 - Decisiones y preguntas abiertas

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Decisiones confirmadas

| Decisión | Origen | Estado |
|---|---|---|
| Priorizar facilidad para operarios con conocimientos tecnológicos casi nulos | Objetivo original | Requisito rector. |
| Mantener herramientas más complejas para gerentes | Objetivo original | Alcance de producto; permisos pendientes. |
| React 18, Vite, Tailwind y Base44 | Objetivo original | Stack de la implementación. |
| Entidades Tambor, Historial, Movimiento y Catalogo | Objetivo original | Esquemas y repositorio creados. |
| CODE 128 y lector USB como teclado | Objetivo original | Implementado; hardware pendiente. |
| Construir un MVP para una empresa que cargará datos reales | Aclaración del usuario durante la sesión | El piloto debe separar ejemplos y operación real. |
| Documentar en Obsidian con índice y archivos ordenados | Solicitud posterior del usuario | Sección específica preparada. |

## Decisiones de implementación

- Sin App ID se utiliza una demo persistente en el navegador.
- Se añade estado opcional al formulario de movimientos.
- Se consulta también Historial al calcular el siguiente número para evitar reutilización tras borrado.
- Eliminar requiere escribir el identificador visible.
- La demo no restringe funciones por rol, acorde al alcance inicial; esto no valida permisos en producción.

Estas elecciones pueden ajustarse después del piloto. El modo local no fue elegido por la empresa como almacenamiento oficial.

## Propuestas todavía no implementadas

Se propuso separar un espacio vacío para datos propios y agregar copia de seguridad. En el corte documentado ambas siguen pendientes. No se debe describirlas como entregadas hasta implementarlas y probarlas.

## Preguntas abiertas para la empresa

1. ¿Existe una aplicación Base44 y quién administra esa cuenta?
2. ¿Cuántas personas y computadoras registrarán datos simultáneamente?
3. ¿Qué catálogos, códigos y nomenclatura de lotes se usan hoy?
4. ¿Qué impresora, tamaño de papel y lector USB estarán disponibles?
5. ¿Qué cambios puede hacer un operario y cuáles requieren autorización?
6. ¿Se permite eliminar un tambor o se prefiere una baja lógica?
7. ¿Se necesita conservar etiquetas antiguas como códigos de búsqueda?
8. ¿Quién revisa inconsistencias, genera copias y coordina recuperación?
9. ¿Se migrará un inventario existente? No se entregó una fuente de datos.
10. ¿Qué muestra y criterio se usarán para aceptar el piloto?

No se han supuesto respuestas. Los nombres «Planta Luján de Cuyo» y «Mendoza» de la interfaz son texto de presentación y requieren confirmación de la empresa.

## Registro de cambios documentales

- **2026-09-24:** primera base de conocimiento. Se preserva la especificación original y se separa alcance solicitado, código actual y validación pendiente.
