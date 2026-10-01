---
title: "15 - Manual de uso y funcionalidades para gerencia"
proyecto: "Olivícola Luján"
tipo: documentacion-gerencial
actualizado: 2026-10-01
version: "1.0.6"
autor: "Jairo López"
propiedad: "Software diseñado, desarrollado y propiedad exclusiva de Jairo López"
tags:
  - olivicola-lujan
  - trazabilidad
  - gerencia
  - manual-usuario
  - kpis-produccion
  - jairo-lopez
---

# 15 - Manual de Uso y Funcionalidades para Gerencia

> [!important] Declaración de Autoría y Propiedad del Software
> **Sistema de Trazabilidad Industrial de Tambores - Olivícola Luján S.A.**  
> **Versión:** 1.0.6 Producción Estable (Desktop Nativo Windows/macOS & LAN Local)  
> **Autor, Arquitecto y Desarrollador:** **Jairo López**  
> **Propiedad Intelectual:** Software diseñado, desarrollado y propiedad intelectual exclusiva de **Jairo López**. Todos los derechos reservados.

---

## 1. Visión Ejecutiva y Propósito del Software

El **Sistema de Trazabilidad Industrial de Tambores de Olivícola Luján** fue concebido y desarrollado para resolver de manera definitiva las tres grandes problemáticas de la planta aceitunera:
1. **Pérdida de trazabilidad unitaria:** Al trabajar con cientos de tambores por nave, los métodos basados en planillas de papel o planillas Excel aisladas generaban desfases entre el stock teórico y el físico. El software asigna un identificador unitario único e irrepetible a cada tambor (`T000001`), vinculado a su lote, variedad, calibre y calidad.
2. **Fricción tecnológica en el operario:** Los operarios en nave no deben lidiar con interfaces complejas. El sistema minimiza la carga manual completando pesos de referencia automáticos (140 kg descarozada, 160 kg rodajas/rellenas, 180 kg entera/griega) y genera la codificación oficial alfanumérica y compacta sin margen de error humano.
3. **Control gerencial y auditoría en tiempo real:** La dirección cuenta con visibilidad instantánea del tonelaje procesado, estado de calidad (aprobado, cuarentena, rechazado), ocupación física de naves y trazabilidad completa de cada movimiento.

---

## 2. Pantallas y Funcionalidades del Sistema

### 2.1. Panel de Control (Dashboard)
- **Métricas Consolidadas:** Visualiza en tiempo real el tonelaje total en stock (ej. 210.800 kg sobre 1.250 tambores activos), la tasa de aprobación de calidad (>91%), tambores en cuarentena y capacidad ocupada por nave.
- **Gráficos de Variedades y Calidades:** Distribución porcentual entre variedades maestras (*Arauco, Manzanilla Fina, Aloreña, Picual, Empeltre*) y calidades (*Primera, Segunda, Tercera*).
- **Botón de Reporte Ejecutivo PDF:** Acceso inmediato para generar y descargar el informe formal de 2 páginas con todos los KPIs productivos y el presente manual de gerencia.

### 2.2. Escaneo y Consulta Rápida
- **Búsqueda Instantánea:** Búsqueda por ID de tambor, código de lote o código alfanumérico compacto.
- **Compatibilidad con Hardware:** Reconoce ráfagas de lectura del escáner inalámbrico **HPRT N130BT** o lectura mediante cámara web / USB.
- **Ficha Rápida:** Muestra al instante el estado de calidad, sector actual, peso neto, variedad, fecha de pesaje y operario responsable.

### 2.3. Inventario General de Tambores
- **Búsqueda y Filtros Combinados:** Filtrado simultáneo por tipo de producto, variedad, calibre, calidad, estado y ubicación física.
- **Acciones Rápidas:** Cambio de estado de lote, reubicación de tambor e impresión de etiquetas individuales o masivas.
- **Exportación de Datos:** Descarga de la base activa en formatos estructurados JSON y planillas Excel/CSV para conciliación administrativa.

### 2.4. Toma de Inventario por Sectores
- **Flujo de Escaneo en Ráfaga:** El operario escanea primero la etiqueta de sector (ej. `NAV-A1`, `NAV-B2`) y a continuación escanea todos los tambores ubicados físicamente en dicha zona utilizando el modo almacenamiento (Storage Mode) del escáner **HPRT N130BT**.
- **Procesamiento Inteligente:** Al descargar la memoria, el sistema agrupa tambores por código alfanumérico (ej. "14 tambores de ENT-VDE-ALOR-121/140-PRI"), verifica duplicados por ID de tambor y actualiza automáticamente el sector de cada unidad si fue reubicada.
- **Impresión de Identificadores de Sector:** Permite imprimir en la Zebra GC420t las etiquetas de señalización de pasillos, naves y columnas.

### 2.5. Registro de Tambores & Pesaje
- **Catálogo Oficial del Excel de Gerencia:** Selección asistida de Producto, Color/Presentación, Variedad, Calibre y Calidad.
- **Generación Automática de Códigos:**
  - *Código Alfanumérico Completo:* ej. `ENT-VDE-ALOR-121/140-PRI`.
  - *Código Compacto CODE 128:* ej. `ENTVDEALOR121140PRI` (estándar limpio sin caracteres especiales apto para lectores industriales).
- **Pesos Sugeridos de Fábrica:** El sistema precarga automáticamente el peso neto estándar según el producto seleccionado, acelerando la balanza en línea.
- **Impresión Térmica Directa:** Emisión instantánea de etiquetas en formato 100 mm × 50 mm con código de barras CODE 128 nítido, ID de tambor, denominación comercial y comandos nativos **ZPL II**.

### 2.6. Módulo de Control de Calidad
- **Inspección de Lotes:** Registro de parámetros organolépticos, salinidad, pH y consistencia.
- **Transición de Estados:** Capacidad de liberar lotes a producción/despacho, pasarlos a retención preventiva (Cuarentena) o declararlos No Conformes con registro del auditor responsable y justificación técnica.

### 2.7. Personal y Seguridad Operacional
- **Jerarquía Estricta de Perfiles:**
  - *Operario:* Interfaz simplificada y protegida. No tiene acceso ni visibilidad a la gestión de usuarios, cambio de roles ni configuración del sistema.
  - *Calidad:* Acceso a liberación de lotes, muestreo y auditoría técnica.
  - *Gerencia / Administrador:* Acceso completo, auditoría en tiempo real, gestión de cuentas y parámetros de red.
- **Protección contra Escalado de Privilegios:** La selección de rol se encuentra restringida exclusivamente bajo autenticación administrativa, evitando que un operario modifique su perfil o contraseñas ajenas.

### 2.8. Conectividad y Respaldo de Base de Datos
- **Modo Servidor Host (LAN):** La computadora central de oficina o balanza ejecuta el backend embebido (Express + SQLite en puerto 4000) y comparte la base en tiempo real con las demás terminales de planta.
- **Modo Terminal Cliente:** Las computadoras secundarias de naves o balanzas se conectan a la IP del servidor Host con sincronización instantánea.
- **Respaldo de Seguridad:** Generación con un clic de copias de seguridad de la base de datos completa (`.sqlite` y `.json`), garantizando la preservación total de la información histórica de la empresa.

---

## 3. Indicadores Clave de Rendimiento (KPIs) para la Gerencia

| KPI Gerencial | Fórmula / Medición | Meta Operativa | Impacto en la Rentabilidad |
|---|---|---|---|
| **Eficacia de Stock (kg)** | Kg Reales Auditados / Kg Teóricos en Sistema | 100% (Tolerancia ±0.2%) | Elimina pérdidas invisibles y desvíos de fruta en salmuera. |
| **Tasa de Aprobación de Calidad** | (Tambores Aprobados / Total Tambores) × 100 | ≥ 92.0% | Maximiza el valor agregado de fruta categorizada como Primera. |
| **Tiempo de Pesaje y Etiquetado** | Segundos promedio por tambor en balanza | < 18 segundos | Eleva la productividad por turno de trabajo en temporada pico. |
| **Precisión de Ubicación por Nave** | Tambores en Sector Correcto / Total Auditados | ≥ 99.5% | Reduce tiempos muertos de autoelevadores y preparación de pedidos. |
| **Trazabilidad de No Conformidades** | % Lotes con causa raíz y acción correctiva | 100% documentado | Garantiza certificaciones de exportación y auditorías de clientes. |

---

## 4. Hardware Homologado y Calibrado

1. **Impresora Térmica de Escritorio Zebra GC420t:**
   - Resolución: 203 dpi (8 dots/mm).
   - Formato de etiqueta: 100 mm de ancho × 50 mm de alto (papel térmico con sensor de separación de etiquetas / gap).
   - Modo de impresión: Código de barras CODE 128 de alto contraste y comandos directos ZPL II (`^XA...^XZ`) para máxima nitidez y velocidad.
2. **Escáner Inalámbrico HPRT N130BT:**
   - Modos de operación: Comunicación inalámbrica directa o modo almacenamiento interno (*Storage Mode*) para inventariar hasta 10.000 códigos sin conexión antes de volcar por ráfaga a la aplicación.
   - Configuración: Sufijo `Enter` calibrado en el sistema para captura instantánea de tambores.

---

## 5. Certificado de Propiedad Intelectual y Firma de Autoría

```
================================================================================
          CERTIFICACIÓN DE AUTORÍA Y PROPIEDAD INTELECTUAL DEL SOFTWARE         
================================================================================

Por medio del presente documento se certifica que la arquitectura, diseño de
interfaz, lógica de trazabilidad industrial, adaptaciones de hardware, motores
de reportes y código fuente del:

         "SISTEMA DE TRAZABILIDAD INDUSTRIAL DE TAMBORES - OLIVÍCOLA LUJÁN"
                         Versión 1.0.6 (Build Oficial 2026)

ha sido concebido, estructurado y programado íntegramente por:

                                  JAIRO LÓPEZ
                          Ingeniero de Software y Autor

Todos los derechos morales y patrimoniales sobre esta obra informática están
reservados de conformidad con las leyes vigentes de propiedad intelectual y
derechos de autor de la República Argentina y tratados internacionales.

Firma: ___________________________          Fecha de Entrega: 01/10/2026
       JAIRO LÓPEZ                          Lugar: Mendoza, Argentina
================================================================================
```
