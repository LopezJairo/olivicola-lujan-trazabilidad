---
title: "14 - Glosario y mantenimiento"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - glosario
  - mantenimiento
---

# 14 - Glosario y mantenimiento

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Glosario de Términos Industriales y de Software

| Término | Definición en el Contexto de Olivícola Luján |
|---|---|
| **Tambor** | Unidad básica de contención y estiba industrial (tambores plásticos de 140, 160 o 180 kg según el producto). |
| **Tambor ID (`tambor_id`)** | Identificador visible secuencial permanente (ej. `T000001`). Nunca se repite ni se recicla tras una baja. |
| **Código Descriptivo** | Código alfanumérico con guiones que resume las 5 características principales: `PRODUCTO-PRESENTACIÓN-VARIEDAD-CALIBRE-CALIDAD` (ej: `ENT-VDE-ALOR-121/140-PRI`). |
| **Código Compacto** | Código alfanumérico sin guiones ni barras (`ENTVDEALOR121140PRI`), optimizado como base oficial para generar el código de barras CODE 128. |
| **Código Completo con ID** | Identificador total de trazabilidad: `ENT-VDE-ALOR-121/140-PRI-T000001`. Permite saber el contenido y la unidad individual exacta. |
| **CODE 128** | Simbología de código de barras de alta densidad utilizada en las etiquetas térmicas. |
| **ZPL II (Zebra Programming Language)** | Lenguaje nativo de control de las impresoras industriales Zebra GC420t que permite imprimir a nivel de hardware con máxima nitidez. |
| **Sensor de Espacio (Gap / Web)** | Muesca o separación entre etiquetas en el rollo que la impresora detecta ópticamente para cortar o detener el avance con precisión milimétrica. |
| **Modo Batch / Almacenamiento** | Modalidad del escáner HPRT N130BT que permite guardar en memoria interna hasta 50.000 lecturas en planta para volcarlas luego en ráfaga a la computadora. |
| **Servidor Host** | Computadora principal de la planta (ej. Balanza de Entrada) que aloja la base de datos SQLite y sirve la API local en el puerto 4000. |
| **Terminal Cliente LAN** | Computadora secundaria que se conecta por red interna a la IP del Servidor Host para consultar y actualizar datos en tiempo real. |
| **Legajo** | Identificador corto único del empleado (ej. `OP-01`, `CAL-01`, `ADM-01`) para inicio de sesión en el sistema. |
| **Clave Maestra de Autorización** | Contraseña confidencial de gerencia requerida para otorgar o modificar permisos de administración y calidad. |
| **Liberación de Lote** | Dictamen formal emitido por el responsable de calidad tras el análisis fisicoquímico que habilita un lote para calibrado o despacho. |

---

## Mantenimiento de la Bóveda de Documentación

1. **Ubicaciones:**
   - La documentación reside en la carpeta `docs/obsidian/` del repositorio de código fuente y se replica en la bóveda de Obsidian del usuario en `/Users/jairolopez/Desktop/Claude by Jairo/Claude by Jairo/Olivícola Luján`.
2. **Normas de Redacción:**
   - Cada nota cuenta con metadatos frontmatter YAML (`title`, `proyecto`, `actualizado`, `version`, `tags`).
   - Los enlaces internos emplean sintaxis Obsidian estándar con nombre de carpeta: `[[Olivícola Luján/XX - Nombre de Nota|XX - Nombre de Nota]]`.
3. **Actualización:**
   - Cada cambio de versión (ej. v1.0.6 a v1.0.7) debe registrarse en el índice general (`00`) y en la nota de estado (`10`).
   - Mantener las notas sincronizadas entre el repositorio y la bóveda local de Obsidian.
