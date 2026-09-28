export const DEFAULT_VERSIONS_DATA = {
  app_name: "Olivícola Luján - Sistema de Trazabilidad Industrial",
  latest_version: "1.0.0",
  updated_at: "2026-09-28",
  contact_support: "soporte@olivicolalujan.com",
  releases: [
    {
      version: "1.0.0",
      date: "28 de Septiembre, 2026",
      tag: "Estable · Recomendada",
      status: "latest",
      summary: "Lanzamiento oficial de producción con arquitectura de red híbrida, servidor local embebido, soporte para hardware industrial Zebra y HPRT, y consola de diagnóstico en vivo.",
      downloads: {
        windows: {
          available: true,
          name: "Windows x64",
          arch: "64-bit (x86_64)",
          os_req: "Windows 10 / 11",
          size: "81 MB",
          portable_name: "Olivicola Lujan Trazabilidad 1.0.0.exe",
          portable_url: "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad.1.0.0.exe",
          setup_name: "Olivicola Lujan Trazabilidad Setup 1.0.0.exe",
          setup_url: "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad.Setup.1.0.0.exe",
          role_badge: "Recomendado para Servidor Host o Cliente"
        },
        mac: {
          available: true,
          name: "macOS",
          arch: "Apple Silicon (ARM64)",
          os_req: "macOS 12.0+",
          size: "98 MB",
          dmg_name: "Olivicola Lujan Trazabilidad-1.0.0-arm64.dmg",
          dmg_url: "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad-1.0.0-arm64.dmg",
          zip_name: "Olivicola Lujan Trazabilidad-1.0.0-arm64-mac.zip",
          zip_url: "https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/download/v1.0.0/Olivicola.Lujan.Trazabilidad-1.0.0-arm64-mac.zip",
          role_badge: "Terminal Cliente LAN o Administración"
        }
      },
      changelog: [
        {
          category: "Red & Servidor",
          text: "Modo Servidor Host LAN embebido en Windows con base de datos JSON resiliente y sincronización en tiempo real."
        },
        {
          category: "Diagnóstico",
          text: "Consola de registros (Logs) y autodiagnóstico de red en vivo integrado en la interfaz de configuración."
        },
        {
          category: "Impresión Térmica",
          text: "Etiquetas 100x50 mm para Zebra GC420t con ZPL II directo y formato limpio de alta densidad."
        },
        {
          category: "Escáner Industrial",
          text: "Recepción en ráfaga para memoria interna de escáner HPRT N130BT y flujo de inventario por sectores."
        },
        {
          category: "Catálogo Oficial",
          text: "Integración completa de la matriz de calibres, variedades (Arauco, Aloreña, Manzanilla), pesos sugeridos y códigos CODE 128."
        },
        {
          category: "Seguridad",
          text: "Control de acceso por roles (Operario de Planta, Calidad y Gerencia)."
        }
      ]
    }
  ]
};
