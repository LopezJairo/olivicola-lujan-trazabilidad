# OLIVÍCOLA LUJÁN · Trazabilidad de Tambores

Sistema de trazabilidad, control de pesaje, movimientos físicos y etiquetado con código de barras CODE 128 para planta de producción olivícola en Luján de Cuyo, Mendoza.

Diseñado con enfoque de **baja fricción para operarios** de planta con conocimientos tecnológicos mínimos, y herramientas de auditoría y gestión de catálogos para administradores y gerentes.

---

## Características Implementadas

1. **Gestión de Tambores (CRUD Completo):**
   - Asignación secuencial automática e incremental de identificador visible (`T000001` … `T999999` y crecimiento a 7 dígitos).
   - Prevención de reciclado de identificadores de tambores eliminados consultando tanto tambores como historial.
   - Construcción de código descriptivo (`ENT-VDE-ALOR-161/200-PRI`) y código completo (`ENT-VDE-ALOR-161/200-PRI-T000001`).
   - Normalización de pesaje en kg, lote y validación estricta de fechas de calendario (`fecha_elaboracion <= fecha_ingreso`).
   - Eliminación protegida por confirmación explícita escribiendo el identificador exacto del tambor.
   - Conservación inalterable del historial y movimientos tras una baja.

2. **Puesto de Escaneo con Lector USB:**
   - Foco automático permanente en el campo de lectura.
   - Detección instantánea al recibir retorno de carro (`Enter`).
   - Búsqueda exacta insensible a mayúsculas contra `tambor_id` o `codigo`.
   - Feedback auditivo mediante síntesis Web Audio API (chime de confirmación o alerta).
   - Acceso inmediato con un clic a ficha, movimiento o impresión.

3. **Inventario y Búsqueda Multicriterio:**
   - Búsqueda insensible a mayúsculas y acentos (`cordoba` encuentra `LOTE-CÓRDOBA`).
   - Filtros avanzados por los 7 catálogos del tambor (Producto, Presentación, Variedad, Calibre, Calidad, Ubicación, Estado).
   - Resumen dinámico de totales: cantidad de tambores, kilogramos netos acumulados y ubicaciones ocupadas.
   - Selección múltiple para impresión masiva de etiquetas.

4. **Etiquetas Físicas y Código de Barras CODE 128:**
   - Generación de código de barras CODE 128 en formato vectorial SVG con `jsbarcode`.
   - Dimensiones predeterminadas de 50 mm ancho × 100 mm alto (5 × 10 cm), configurables en milímetros.
   - Hojas de estilo de impresión `@media print` con saltos de página obligatorios (`page-break-after: always`).
   - Impresión individual y por lotes seleccionados.

5. **Línea de Tiempo y Auditoría Histórica:**
   - Historial global y por tambor ordenado de forma descendente.
   - Auditoría campo por campo en ediciones, guardando `valor_anterior` y `valor_nuevo`.
   - Atribución de usuario y rol por cada evento.

6. **Catálogos Administrables:**
   - 8 tipos de catálogo dinámicos sin valores fijos en el código.
   - Control de unicidad de código dentro del mismo tipo.
   - Posibilidad de desactivar opciones sin alterar registros históricos previos.
   - Preservación de opciones inactivas en edición si ya estaban previamente asignadas al tambor.

7. **Espacios de Trabajo y Respaldo:**
   - **Modo Demostración:** 12 tambores de prueba precargados con movimientos e historial.
   - **Espacio Empresa:** Espacio limpio listo para carga de lotes reales sin mezclar datos de prueba.
   - **Exportación / Importación JSON:** Copias de seguridad completas descargables y restaurables con un clic.
   - Botón para restablecer datos de demostración en cualquier momento.

---

## Puesta en Marcha Local

### 1. Requisitos
- Node.js >= 18 (verificado en v25.1.0)
- npm >= 9 (verificado en v11.6.2)

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Ejecutar pruebas automatizadas
```bash
npm test
```
*Ejecuta los 17 tests de dominio y repositorio (10 de reglas de negocio + 7 de repositorio integral).*

### 4. Iniciar servidor de desarrollo local
```bash
npm run dev
```
Abrir en el navegador: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### 5. Compilación para producción
```bash
npm run build
```

---

## Atajos de Teclado para Planta

- <kbd>1</kbd> Inicio / Panel
- <kbd>2</kbd> Escanear Tambor (Lector USB)
- <kbd>3</kbd> Inventario
- <kbd>4</kbd> Registrar Nuevo Tambor
- <kbd>5</kbd> Historial Global
- <kbd>6</kbd> Configuración y Catálogos

---

## Estructura del Proyecto

```text
├── base44/
│   └── entities/          # Esquemas JSON de Tambor, Historial, Movimiento y Catalogo
├── docs/
│   └── obsidian/          # Documentación original del proyecto (16 archivos Markdown)
├── skills/                # Skills de desarrollo e ingeniería (obra/superpowers)
├── src/
│   ├── api/
│   │   ├── base44Client.js# Adaptador de conexión Base44 / fallback local
│   │   ├── demoData.js    # Catálogos base y 12 tambores de demostración
│   │   └── repository.js  # Persistencia, transiciones de espacio y auditoría
│   ├── components/
│   │   ├── ui/            # Botones con micro-interacciones, diálogos Radix, badges
│   │   ├── Auth.jsx       # Proveedor de autenticación y selector de rol
│   │   ├── Barcode.jsx    # Generador CODE 128 y plantilla de etiqueta física
│   │   └── Layout.jsx     # Shell con sidebar, navegación y atajos
│   ├── lib/
│   │   ├── domain.js      # Lógica pura de negocio, validaciones, códigos y filtros
│   │   └── utils.js       # Composición cn y formateo de kilos y fechas
│   ├── pages/             # Vistas de la aplicación
│   ├── App.jsx            # Enrutamiento de la SPA
│   ├── main.jsx           # Montaje con React Query y Error Boundary
│   └── index.css          # Tokens de diseño de alta gama y estilos de impresión
└── tests/
    ├── domain.test.js     # Pruebas de reglas de negocio
    └── repository.test.js # Pruebas de integración del ciclo de vida
```
