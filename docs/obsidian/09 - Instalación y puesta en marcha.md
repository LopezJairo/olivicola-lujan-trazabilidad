---
title: "09 - Instalación y puesta en marcha"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - instalacion
  - red-lan
  - ejecutables
---

# 09 - Instalación y puesta en marcha

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Descarga de Ejecutables Oficiales

Los instaladores y binarios portables para Windows y macOS están centralizados en el portal oficial de distribución:

🌐 **Portal de Descargas:** [https://portal-lopezjairos-projects.vercel.app](https://portal-lopezjairos-projects.vercel.app)  
📦 **GitHub Release v1.0.6:** [https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/tag/v1.0.6](https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/tag/v1.0.6)

### Enlaces Directos de Descarga (v1.0.6):
- **Windows Instalador Setup:** `Olivicola.Lujan.Trazabilidad.Setup.1.0.6.exe` (Recomendado para PC Principal y Terminales fijas).
- **Windows Versión Portable:** `Olivicola.Lujan.Trazabilidad.1.0.6.exe` (Ejecutable directo sin instalación).
- **macOS Instalador DMG:** `Olivicola.Lujan.Trazabilidad-1.0.6-arm64.dmg` (Apple Silicon M1/M2/M3/M4).
- **macOS Paquete ZIP:** `Olivicola.Lujan.Trazabilidad-1.0.6-arm64-mac.zip`.

---

## 1. Puesta en Marcha en la Computadora Principal (Servidor Host)

La computadora principal de planta (generalmente la PC de la Balanza de Entrada) actuará como Servidor Host:

1. **Instalación:** Ejecuta `Olivicola.Lujan.Trazabilidad.Setup.1.0.6.exe` y sigue el asistente estándar de Windows.
2. **Asignación de IP Estática:**
   - En Windows: Ve a *Configuración de Red e Internet > Ethernet / Wi-Fi > Propiedades de IP*.
   - Configura una dirección IP estática en el rango de planta (ejemplo: `192.168.1.50`, máscara `255.255.255.0`, puerta de enlace `192.168.1.1`).
3. **Regla de Firewall de Windows:**
   - Abre *Panel de Control > Firewall de Windows Defender > Configuración Avanzada*.
   - Crea una **Regla de Entrada**: Protocolo TCP, Puerto local específico `4000`, permitir la conexión en redes privadas.
4. **Activación del Servidor:**
   - Inicia la aplicación con usuario Administrador.
   - Ve a **Configuración** (`/configuracion`) > *Arquitectura de Red y Servidor Embebido*.
   - Selecciona **Modo Servidor Host** y presiona **Arrancar Servidor Embebido**.
   - El estado indicará `Servidor Activo en http://0.0.0.0:4000`.

---

## 2. Puesta en Marcha en Terminales Cliente LAN

Para las computadoras de Laboratorio de Calidad, Balanza Secundaria, Nave de Calibrado y Gerencia:

1. **Instalación:** Instala la aplicación en la máquina cliente.
2. **Configuración de Conexión:**
   - Abre la aplicación.
   - Ve a **Configuración** > *Arquitectura de Red y Servidor Embebido*.
   - Selecciona **Modo Terminal Cliente**.
   - En el campo *Dirección del Servidor Host*, escribe la IP de la computadora principal:  
     `http://192.168.1.50:4000`
3. **Prueba de Enlace:**
   - Presiona **Probar Conexión**.
   - El sistema enviará una señal de sondeo. Al recibir confirmación en milisegundos con estado verde, presiona **Guardar y Sincronizar**.
4. **Operación Unificada:**
   - A partir de ese instante, cualquier tambor registrado, pesado o liberado en una terminal se reflejará inmediatamente en todas las demás computadoras de la planta.

---

## 3. Instalación de Periféricos en Puesto de Trabajo

### Impresora Térmica Zebra GC420t:
1. Conecta el cable USB de la Zebra a la computadora.
2. Windows instalará el driver básico automáticamente (o instala el driver oficial *ZDesigner GC420t*).
3. En las preferencias de la impresora en Windows/macOS:
   - Tamaño de papel: **Personalizado 100 mm ancho × 50 mm alto**.
   - Tipo de sensor: **Sensor de espacio (Web / Gap)**.
   - Velocidad: 50.8 mm/s (2 ips) o 76.2 mm/s (3 ips).
   - Oscuridad: 15 - 20 (para negro óptico profundo en CODE 128).

### Escáner HPRT N130BT:
1. Conecta el receptor inalámbrico USB en la computadora.
2. Escanea el código del manual *"Factory Default"* y luego *"Bluetooth / 2.4G Wireless Pairing"*.
3. Escanea el código *"Add CR/LF (Enter) Suffix"*.
4. Prueba leyendo cualquier código en el Bloc de Notas: debe escribir el texto y hacer un salto de línea instantáneo.

---

## 4. Procedimiento de Actualización de Versiones

Las actualizaciones (ej. de v1.0.5 a v1.0.6) no requieren migración manual de datos:
1. Cierra la aplicación en las terminales.
2. Descarga el nuevo instalador desde el portal web.
3. Ejecuta el instalador: sobrescribirá los binarios del software preservando íntegramente la base de datos `data/olivicola.db` y las sesiones configuradas.
4. Vuelve a abrir la aplicación.
