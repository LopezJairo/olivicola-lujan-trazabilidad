---
title: "12 - Pendientes y hoja de ruta"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - roadmap
  - estado
---

# 12 - Pendientes y hoja de ruta

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Registro de Trabajo Completado

### Fase 1: Arquitectura y Lógica Central (Completada)
- [x] Estructura modular React 18 + Vite 5 + Tailwind CSS.
- [x] Modelo de dominio con 6 entidades normalizadas (Tambor, Movimiento, Historial, Catálogo, Usuario, Configuración).
- [x] Generación de códigos: Descriptivo (`ENT-VDE-ALOR-121/140-PRI`), Compacto (`ENTVDEALOR121140PRI`) y CODE 128.
- [x] Incorporación completa de los catálogos oficiales del Excel de Gerencia General.
- [x] Pesos sugeridos automáticos por tipo de producto (140, 160 y 180 kg).

### Fase 2: Hardware Industrial y Flujo de Planta (Completada)
- [x] Soporte nativo para impresora industrial **Zebra GC420t** (203 dpi, ZPL II y CSS print 100x50 mm).
- [x] Integración de escáner inalámbrico **HPRT N130BT** en modo memoria batch y emulación teclado.
- [x] Flujo de Toma de Inventario Físico por Sectores con deduplicación y recuento masivo (`/inventario/toma`).
- [x] Módulo exclusivo de Control de Calidad y liberación de lotes (`/calidad`).

### Fase 3: Escritorio, Red LAN y Seguridad de Accesos (Completada)
- [x] Empaquetado de escritorio nativo con Electron 33 para Windows (.exe) y macOS (.dmg).
- [x] Servidor backend embebido en Express + SQLite para red LAN (puerto 4000).
- [x] Modos de red: Servidor Host, Terminal Cliente LAN y Modo Autónomo.
- [x] Jerarquía de accesos y autenticación por Legajo y Contraseña.
- [x] **Seguridad v1.0.6:** Inhabilitación estricta de cambio de rol para operarios y ocultamiento 100% de secciones administrativas.
- [x] Portal web de descargas desplegado en Vercel (`https://portal-topaz-five-74.vercel.app`) con integración a GitHub Releases.

### Fase 4: Reportes Ejecutivos & Documentación Gerencial (Completada)
- [x] Generador en ReportLab del **Informe Ejecutivo de Producción & Métricas** (PDF de 2 páginas con balance de 210.800 kg de stock, calibres, variedades y calidad).
- [x] **Manual de Uso y Funcionalidades para Gerencia** (PDF corporativo de 4 páginas) con certificación formal de autoría y propiedad de software de Jairo López.
- [x] Botón integrado en el encabezado del Dashboard con modal de descarga, visualización e impresión directa de ambos reportes.
- [x] Batería de 101 pruebas automatizadas en Vitest (100% aprobadas con cobertura de reporte en tiempo real y UI).

---

## Hoja de Ruta Inmediata (Puesta en Marcha en Planta)

1. **Instalación en la PC de Balanza:**
   - Instalar `Olivicola.Lujan.Trazabilidad.Setup.1.0.6.exe` y configurar como Servidor Host (puerto 4000).
2. **Conexión de Terminales Secundarias:**
   - Instalar en el Laboratorio de Calidad y computadoras de supervisión apuntando a la IP Host.
3. **Calibración de la Zebra GC420t:**
   - Ajustar el sensor de gap y hacer una tirada de prueba con el rollo de etiquetas de 100 mm × 50 mm.
4. **Capacitación Operativa:**
   - Breve inducción de 15 minutos a los operarios sobre el ingreso con legajo y el uso de los atajos numéricos.

---

## Oportunidades Futuras (Post-Piloto)

- Conexión directa por puerto serie (RS-232 / USB) con balanzas electrónicas industriales (ej. Kretz, Systel, Toledo) para captura automática del peso sin digitación manual.
- Exportación automática de reportes de inventario a planillas Excel (`.xlsx`) y sincronización en la nube mediante backup automatizado nocturno.
