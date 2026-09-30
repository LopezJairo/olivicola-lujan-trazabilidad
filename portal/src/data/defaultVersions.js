export const DEFAULT_VERSIONS_DATA = {
  app_name: "Olivícola Luján - Sistema de Trazabilidad Industrial",
  latest_version: "1.0.3",
  updated_at: "2026-09-29",
  contact_support: "soporte@olivicolalujan.com",
  releases: [
    {
      "version": "1.0.4",
      "date": "30 de Septiembre, 2026",
      "tag": "Estable · Recomendada",
      "status": "latest",
      "summary": "Corrección definitiva de arranque de servidor en Electron: soporte nativo ES Module en paquetes desempaquetados de servidor y catálogos, enlaces de descarga directa y sincronización en tiempo real.",
      "downloads": {
        "windows": {
          "available": true,
          "name": "Windows x64",
          "arch": "64-bit (x86_64)",
          "os_req": "Windows 10 / 11",
          "size": "81 MB",
          "portable_name": "Olivicola Lujan Trazabilidad 1.0.4.exe",
          "portable_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.4/Olivicola.Lujan.Trazabilidad.1.0.4.exe",
          "setup_name": "Olivicola Lujan Trazabilidad Setup 1.0.4.exe",
          "setup_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.4/Olivicola.Lujan.Trazabilidad.Setup.1.0.4.exe",
          "role_badge": "Recomendado para Servidor Host o Cliente"
        },
        "mac": {
          "available": true,
          "name": "macOS",
          "arch": "Apple Silicon (ARM64)",
          "os_req": "macOS 12.0+",
          "size": "99 MB",
          "dmg_name": "Olivicola Lujan Trazabilidad-1.0.4-arm64.dmg",
          "dmg_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.4/Olivicola.Lujan.Trazabilidad-1.0.4-arm64.dmg",
          "zip_name": "Olivicola Lujan Trazabilidad-1.0.4-arm64-mac.zip",
          "zip_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.4/Olivicola.Lujan.Trazabilidad-1.0.4-arm64-mac.zip",
          "role_badge": "Terminal Cliente LAN o Administración"
        }
      },
      "changelog": [
        {
          "category": "Servidor Host",
          "text": "Soporte nativo de ES Module con package.json desempaquetado en runtime, solucionando el error 'Cannot use import statement outside a module' al iniciar el servidor."
        },
        {
          "category": "Descargas Directas",
          "text": "Enlaces de descarga directa CDN a los ejecutables oficiales (.exe y .dmg) alojados en GitHub Releases."
        },
        {
          "category": "Sincronización LAN",
          "text": "Motor reactivo de sincronización automática en tiempo real (heartbeat cada 4s) y botón manual en Inventario."
        },
        {
          "category": "Logs & Diagnóstico",
          "text": "Acceso directo en barra de login y panel de red con latencia en milisegundos y registro de eventos en vivo."
        }
      ]
    },
    {
      "version": "1.0.2",
      "date": "29 de Septiembre, 2026",
      "tag": "Versión Previa",
      "status": "previous",
      "summary": "Versión de alta estabilidad con sincronización LAN en tiempo real, resolución de módulos de servidor en macOS, soporte Gatekeeper y consola de diagnóstico integrada.",
      "downloads": {
        "windows": {
          "available": true,
          "name": "Windows x64",
          "arch": "64-bit (x86_64)",
          "os_req": "Windows 10 / 11",
          "size": "81 MB",
          "portable_name": "Olivicola Lujan Trazabilidad 1.0.2.exe",
          "portable_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.2/Olivicola.Lujan.Trazabilidad.1.0.2.exe",
          "setup_name": "Olivicola Lujan Trazabilidad Setup 1.0.2.exe",
          "setup_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.2/Olivicola.Lujan.Trazabilidad.Setup.1.0.2.exe",
          "role_badge": "Recomendado para Servidor Host o Cliente"
        },
        "mac": {
          "available": true,
          "name": "macOS",
          "arch": "Apple Silicon (ARM64)",
          "os_req": "macOS 12.0+",
          "size": "99 MB",
          "dmg_name": "Olivicola Lujan Trazabilidad-1.0.2-arm64.dmg",
          "dmg_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.2/Olivicola.Lujan.Trazabilidad-1.0.2-arm64.dmg",
          "zip_name": "Olivicola Lujan Trazabilidad-1.0.2-arm64-mac.zip",
          "zip_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.2/Olivicola.Lujan.Trazabilidad-1.0.2-arm64-mac.zip",
          "role_badge": "Terminal Cliente LAN o Administración"
        }
      },
      "changelog": [
        {
          "category": "Sincronización LAN",
          "text": "Motor reactivo de sincronización automática en tiempo real (heartbeat cada 4s) y botón manual en Inventario para reflejo instantáneo de tambores entre Host y Clientes."
        },
        {
          "category": "Servidor Embebido",
          "text": "Desempaquetado físico de módulos de servidor y catálogos en runtime, garantizando arranque instantáneo sin errores de importación en macOS y Windows."
        },
        {
          "category": "Seguridad macOS",
          "text": "Limpieza de cuarentena y guía paso a paso integrada en el portal de descargas para ejecución directa sin bloqueos de Gatekeeper."
        },
        {
          "category": "Logs & Diagnóstico",
          "text": "Acceso directo en barra de login y panel de red con latencia en milisegundos y registro de eventos en vivo."
        }
      ]
    },
    {
      "version": "1.0.1",
      "date": "28 de Septiembre, 2026",
      "tag": "Versión Previa",
      "status": "previous",
      "summary": "Actualización oficial con acceso directo a la Consola de Logs y Diagnóstico en tiempo real, medición de latencia en milisegundos, cargador de 15 tambores de prueba con 1 solo clic y motor de base de datos resiliente compatible con Windows.",
      "downloads": {
        "windows": {
          "available": true,
          "name": "Windows x64",
          "arch": "64-bit (x86_64)",
          "os_req": "Windows 10 / 11",
          "size": "81 MB",
          "portable_name": "Olivicola Lujan Trazabilidad 1.0.1.exe",
          "portable_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.1/Olivicola.Lujan.Trazabilidad.1.0.1.exe",
          "setup_name": "Olivicola Lujan Trazabilidad Setup 1.0.1.exe",
          "setup_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.1/Olivicola.Lujan.Trazabilidad.Setup.1.0.1.exe",
          "role_badge": "Recomendado para Servidor Host o Cliente"
        },
        "mac": {
          "available": true,
          "name": "macOS",
          "arch": "Apple Silicon (ARM64)",
          "os_req": "macOS 12.0+",
          "size": "99 MB",
          "dmg_name": "Olivicola Lujan Trazabilidad-1.0.1-arm64.dmg",
          "dmg_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.1/Olivicola.Lujan.Trazabilidad-1.0.1-arm64.dmg",
          "zip_name": "Olivicola Lujan Trazabilidad-1.0.1-arm64-mac.zip",
          "zip_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.1/Olivicola.Lujan.Trazabilidad-1.0.1-arm64-mac.zip",
          "role_badge": "Terminal Cliente LAN o Administración"
        }

      },
      "changelog": [
        {
          "category": "Logs & Diagnóstico",
          "text": "Botón directo 'Ver Logs y Diagnóstico' en Configuración y consola de eventos en vivo con medición de latencia en milisegundos."
        },
        {
          "category": "Datos de Prueba",
          "text": "Botón de 1 clic 'Cargar 15 Tambores' en Configuración y conjunto oficial de datos de prueba para evaluación de planta."
        },
        {
          "category": "Red & Servidor",
          "text": "Motor de base de datos JSON resiliente sin dependencias de Node 22, solucionando el error de tiempo de espera al arrancar en Windows."
        },
        {
          "category": "Impresión Térmica",
          "text": "Etiquetas 100x50 mm para Zebra GC420t con lenguaje ZPL II nativo y formato limpio."
        },
        {
          "category": "Escáner Industrial",
          "text": "Soporte de ráfagas para memoria interna de escáner HPRT N130BT y flujo de toma de inventario por sectores."
        }
      ]
    },
    {
      "version": "1.0.0",
      "date": "28 de Septiembre, 2026",
      "tag": "Versión Inicial",
      "status": "previous",
      "summary": "Lanzamiento oficial de producción con arquitectura de red híbrida, servidor local embebido y catálogo oficial.",
      "downloads": {
        "windows": {
          "available": true,
          "name": "Windows x64",
          "arch": "64-bit (x86_64)",
          "os_req": "Windows 10 / 11",
          "size": "81 MB",
          "portable_name": "Olivicola Lujan Trazabilidad 1.0.0.exe",
          "portable_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad.1.0.0.exe",
          "setup_name": "Olivicola Lujan Trazabilidad Setup 1.0.0.exe",
          "setup_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad.Setup.1.0.0.exe",
          "role_badge": "Recomendado para Servidor Host o Cliente"
        },
        "mac": {
          "available": true,
          "name": "macOS",
          "arch": "Apple Silicon (ARM64)",
          "os_req": "macOS 12.0+",
          "size": "98 MB",
          "dmg_name": "Olivicola Lujan Trazabilidad-1.0.0-arm64.dmg",
          "dmg_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad-1.0.0-arm64.dmg",
          "zip_name": "Olivicola Lujan Trazabilidad-1.0.0-arm64-mac.zip",
          "zip_url": "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad-1.0.0-arm64-mac.zip",
          "role_badge": "Terminal Cliente LAN o Administración"
        }
      },
      "changelog": [
        {
          "category": "Lanzamiento",
          "text": "Lanzamiento inicial del sistema de trazabilidad de Olivícola Luján."
        }
      ]
    }
  ]
};
