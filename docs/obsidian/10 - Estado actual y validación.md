---
title: "10 - Estado actual y validación"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - validacion
  - testing
  - estado-actual
---

# 10 - Estado actual y validación

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Corte Documentado: 1 de Octubre de 2026 (Versión 1.0.6)

El sistema se encuentra en estado **100% implementado, probado y validado**, empaquetado para distribución en planta con cero errores pendientes de compilación o ejecución.

---

## Matriz de Cobertura Funcional y Técnica

| Módulo o Requerimiento | Estado | Evidencia de Validación |
|---|---|---|
| **Aplicación de Escritorio Nativa** | ✅ Implementado y Verificado | Binarios compilados exitosamente para Windows (`.exe` instalador + portable) y macOS (`.dmg` + `.zip`). Probados con Electron 33. |
| **Backend Express LAN Embebido** | ✅ Implementado y Verificado | Servidor local Express en puerto 4000 con soporte ES Module nativo en `server/index.js`, arranque automático y logs reactivos. |
| **Catálogos Oficiales de Gerencia** | ✅ Implementado y Verificado | 100% de los datos del Excel oficial cargados (Entera, Descarozada, Rodajas, Griegas, Rellenas, Rotas, calibres, variedades Aloreña, Arauco, etc.). |
| **Pesos Sugeridos por Producto** | ✅ Implementado y Verificado | Precarga automática de 140 kg (Descarozada), 180 kg (Entera/Griega) y 160 kg (Rodajas/Rellenas). |
| **Código Compacto y CODE 128** | ✅ Implementado y Verificado | Generación de código sin barras ni guiones (`ENTVDEALOR121140PRI`) y renderizado SVG de alta densidad. |
| **Hardware Zebra GC420t** | ✅ Implementado y Verificado | Formato 100 mm × 50 mm apaisado, comandos nativos ZPL II y reglas CSS print a sangre. |
| **Escáner HPRT N130BT** | ✅ Implementado y Verificado | Soporte de teclado rápido HID, modo memoria batch y decodificación de sectores. |
| **Toma de Inventario por Sectores** | ✅ Implementado y Verificado | Detección de sectores (`NAV-A1`), deduplicación por `tambor_id` y recuento masivo. |
| **Módulo de Calidad** | ✅ Implementado y Verificado | Registro de pH, salinidad, acidez, temperatura y liberación/retención de lotes. |
| **Seguridad de Roles (v1.0.6)** | ✅ Implementado y Verificado | Inhabilitación estricta de cambio de rol para operarios y ocultamiento 100% de secciones de administración en el DOM. |
| **Suite de Pruebas Unitarias** | ✅ Verificado | **94 pruebas aprobadas (0 fallos)** en 7 archivos de pruebas con Vitest. |
| **Portal Web de Distribución** | ✅ Verificado | Desplegado y operativo en Vercel (`https://portal-lopezjairos-projects.vercel.app`) y GitHub Releases v1.0.6. |

---

## Reporte Detallado de Pruebas Automatizadas (Vitest)

Ejecución de `npm test`:

```text
✓ tests/domain.test.js (21 pruebas)
  - Cálculo de Tambor ID y prevención de reutilización de borrados
  - Construcción de código descriptivo, compacto y completo
  - Normalización de pesaje y asignación de pesos sugeridos oficiales
  - Validación de campos requeridos, calidades y calibres oficiales
  - Búsqueda insensible a mayúsculas y acentos

✓ tests/architecture.test.js (21 pruebas)
  - Estructura de componentes y exportaciones
  - Arquitectura de red y configuración de modos Host / Cliente / Offline
  - Compatibilidad de endpoints y manejo de errores

✓ tests/hardware_adaptation.test.js (20 pruebas)
  - Calibración física de etiqueta 100 mm × 50 mm apaisada
  - Generación sintácticamente válida de comandos nativos ZPL II (^XA...^XZ)
  - Procesamiento de ráfagas rápidas de escaneo para HPRT N130BT
  - Deduplicación de tambores en toma de inventario por sector

✓ tests/repository.test.js (13 pruebas)
  - Ciclo de vida CRUD completo de tambores y movimientos
  - Integridad referencial de historial ante modificaciones
  - Exportación e importación de respaldo JSON completo

✓ tests/auth_security.test.jsx (8 pruebas)
  - Carga inicial de legajos y usuarios autorizados
  - Clave maestra de autorización de gerencia
  - Bloqueo de conmutación de rol para operarios (lanza excepción 403)
  - Denegación de gestión de usuarios y cambio de claves a operarios
  - Verificación de renderizado: Jerarquía de Perfiles y Gestión de Personal NO se renderizan en el HTML de operarios

✓ tests/ui.test.jsx (8 pruebas)
  - Renderizado sin errores de todas las páginas del sistema
  - Generación de SVG de CODE 128
  - Etiquetas térmicas de sector y tambores con ID

✓ tests/sync.test.js (3 pruebas)
  - Sincronización reactiva entre puestos LAN
  - Detección de latencia y estado de conexión en vivo

Total: 7 archivos pasados | 94 pruebas aprobadas | 0 fallos
```

---

## Verificación de Compilaciones y Despliegues

1. **Compilación de macOS:**
   - Binarios: `Olivicola Lujan Trazabilidad-1.0.6-arm64.dmg` y `.zip`.
   - Limpieza de atributos extendidos de cuarentena (`xattr -cr`) y firma ad-hoc aplicada.
2. **Compilación de Windows:**
   - Binarios: `Olivicola Lujan Trazabilidad Setup 1.0.6.exe` (NSIS) y `Olivicola Lujan Trazabilidad 1.0.6.exe` (Portable).
   - Generación de mapas de bloques y estructura unpacked limpia.
3. **Distribución en la Nube:**
   - Tag y Release en GitHub: `https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/tag/v1.0.6`.
   - CDN de GitHub entrega HTTP 200 directo a los binarios.
   - Portal web en Vercel configurado con `versions.json` en versión `1.0.6`.
