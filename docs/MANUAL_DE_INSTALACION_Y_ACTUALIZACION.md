# OLIVÍCOLA LUJÁN · Manual de Instalación, Configuración de Red Local y Actualizaciones

Este manual describe el procedimiento para desplegar, conectar en red local y mantener el software de **Trazabilidad de Tambores de Olivícola Luján** en computadoras con **Windows** y **macOS**, garantizando un entorno 100% privado, sin conexión a internet y con sincronización en tiempo real.

---

## 1. Arquitectura del Sistema en Planta

El sistema opera bajo una arquitectura **Host/Terminal en Red Local (LAN)**:

```text
                  ┌────────────────────────────────────────────────────────┐
                  │          RED PRIVADA DE PLANTA (WiFi o Cable LAN)      │
                  └───────────┬────────────────────────────────┬───────────┘
                              │                                │
                 ┌────────────┴───────────┐       ┌────────────┴───────────┐
                 │ PC 1: SERVIDOR CENTRAL │       │ PC 2: PUESTO BALANZA   │
                 │ (Oficina de Planta)    │       │ (Ingreso de Tambores)  │
                 │                        │       │                        │
                 │ • Ejecutable en modo   │       │ • Ejecutable en modo   │
                 │   SERVIDOR             │       │   TERMINAL             │
                 │ • Base SQLite Local    │       │ • Rol: Operador        │
                 │ • IP: 192.168.1.50     │       │ • Conectado a Servidor │
                 └────────────────────────┘       └────────────────────────┘
                              │
                 ┌────────────┴───────────┐
                 │ PC 3: PUESTO NAVE/ESC. │
                 │ (Zebra + HPRT N130BT)  │
                 │                        │
                 │ • Modo TERMINAL        │
                 │ • Rol: Operador        │
                 │ • Conciliación Sectores│
                 └────────────────────────┘
```

- **PC 1 (Servidor Central / Host):** Es la máquina principal (generalmente en la oficina o sala de control). Almacena el archivo maestro de base de datos **SQLite** (`trazabilidad.sqlite`) y responde a las demás máquinas.
- **PC 2, 3, etc. (Terminales de Planta):** Son las computadoras de balanza, puesto de etiquetado o la laptop del gerente. Utilizan el mismo ejecutable, pero en modo cliente, leyendo y guardando datos en la PC 1 al instante.
- **Cero dependencia de Internet:** Toda la comunicación ocurre por el router/switch interno de la fábrica. Si se corta el servicio de internet en la zona, la planta continúa operando con normalidad.

---

## 2. Requisitos Previos

### Hardware:
- **Computadora Servidor:** Cualquier PC con Windows 10/11 (64-bit) o Mac con macOS 12+ (Apple Silicon o Intel). 4 GB de RAM mínimo, 500 MB de disco disponible.
- **Computadoras Terminales:** Cualquier PC de planta con Windows 10/11 o Mac.
- **Red:** Router o switch de planta con conexión cableada Ethernet o WiFi industrial con buena cobertura en naves.

### Periféricos:
- **Impresora térmica:** Zebra GC420t conectada por cable USB a la PC de etiquetado.
- **Lector de códigos:** HPRT N130BT emparejado por Bluetooth o dongle 2.4G a la PC de escaneo.

---

## 3. Instalación en la PC Principal (Servidor de Planta)

### Paso 1: Ejecutar el Instalador
1. Copiar el instalador en la máquina designada como Servidor:
   - Para Windows: `OlivicolaLujan-Setup-1.0.0.exe`
   - Para Mac: `OlivicolaLujan-1.0.0.dmg`
2. Hacer doble clic y seguir los pasos del asistente de instalación.
3. Se creará un acceso directo en el escritorio con el logo oficial de **Olivícola Luján**.

### Paso 2: Configuración Inicial de Modo Servidor
1. Abrir la aplicación.
2. En la pantalla inicial de configuración de conexión, seleccionar:
   `[X] Activar como Servidor Central de esta Planta`
3. El sistema creará automáticamente la base de datos segura en:
   - **En Windows:** `C:\ProgramData\OlivicolaLujan\trazabilidad.sqlite`
   - **En Mac:** `~/Library/Application Support/OlivicolaLujan/trazabilidad.sqlite`
4. El programa indicará en pantalla la dirección IP local de este equipo (por ejemplo: `192.168.1.50`).

### Paso 3: Configuración del Firewall de Windows (Solo en PC Servidor)
Para que las demás computadoras puedan comunicarse con el servidor, se debe permitir el puerto de la aplicación (predeterminado: **4000**):
1. Abrir el menú Inicio de Windows y escribir **"Firewall de Windows Defender con seguridad avanzada"**.
2. Ir a **Reglas de entrada** > **Nueva regla...**
3. Seleccionar **Puerto** > Siguiente.
4. Elegir **TCP** y en puertos locales específicos escribir: `4000` > Siguiente.
5. Seleccionar **Permitir la conexión** > Siguiente.
6. Dejar marcadas las redes **Privada** y **Dominio** (desmarcar Pública) > Siguiente.
7. Nombre: `Olivicola Lujan Trazabilidad` > Finalizar.

> **Recomendación de Red:** Se sugiere configurar en el router de la empresa una **IP estática** o fija para la PC Servidor (ej: `192.168.1.50`) para que la dirección nunca cambie tras un reinicio del router.

---

## 4. Instalación en las PC Terminales (Balanza, Escaneo, Gerencia)

1. En cada computadora adicional de la planta, instalar el mismo instalador (`OlivicolaLujan-Setup-1.0.0.exe` o `.dmg`).
2. Abrir la aplicación.
3. En la pantalla de conexión, seleccionar:
   `[X] Conectar a Servidor Central de Planta`
4. Escribir la dirección IP del servidor configurado en el paso anterior:
   `http://192.168.1.50:4000`
5. Pulsar el botón **"Probar Conexión"**. El sistema mostrará un indicador verde: *"Conectado exitosamente con Servidor Central"*.
6. Pulsar **"Guardar y Continuar"**. La terminal queda lista y enlazada de forma permanente.

---

## 5. Configuración de Usuarios, Perfiles y Jerarquías

Al iniciar por primera vez, el sistema cuenta con el perfil maestro de administración:
- **Usuario:** `admin` (o `gerencia`)
- **Rol:** `Gerente / Administrador`

### Creación de Cuentas por Jerarquía
Desde el menú **Configuración** > **Gestión de Personal y Roles**:
1. **Crear perfil Operador (Balanza / Planta):**
   - Asignar nombre (ej. `operario.balanza`), contraseña e indicar rol **Operador de Planta**.
   - *Permisos:* Pesaje, registro de nuevo tambor, toma de inventario por sectores, escaneo e impresión.
   - *Bloqueos:* No puede eliminar tambores, no puede alterar variedades ni calibres, no puede borrar historial.
2. **Crear perfil Control de Calidad / Capataz:**
   - Asignar rol **Calidad**.
   - *Permisos:* Todo lo del operador más autorización de lotes, muestreos de salmuera y reubicaciones.
3. **Crear perfil Gerencia:**
   - Asignar rol **Gerente**.
   - *Permisos:* Auditoría completa en tiempo real de cada movimiento, reportes de stock consolidado, modificación de catálogos y copias de seguridad.

---

## 6. Configuración de Periféricos de Planta

### Impresora Térmica Zebra GC420t:
1. Conectar la Zebra por cable USB a la computadora de impresión.
2. Instalar el driver oficial *ZebraDesigner Driver* para Windows o configurar como *Raw/ZPL* en CUPS para macOS.
3. En propiedades de la impresora, configurar el tamaño de etiqueta predeterminado:
   - **Ancho:** `100 mm` (o 4.0 pulgadas)
   - **Alto:** `50 mm` (o 2.0 pulgadas)
   - **Tipo de papel:** Térmico con sensor de separación (*Web / Gap*).
4. Calibración física de papel: con el rollo colocado y la tapa cerrada, mantener presionado el botón verde **FEED** hasta que parpadee dos veces y soltar; la impresora avanzará 2 o 3 etiquetas y calibrará el sensor milimétrico.

### Escáner Inalámbrico HPRT N130BT:
1. Emparejar el escáner a la PC mediante su receptor USB 2.4G o Bluetooth.
2. Ir en el software a la sección **Ayuda y Manual** > **Códigos de Calibración HPRT N130BT**.
3. Apuntar el escáner a la pantalla y leer en secuencia:
   - Código 1: **Modo Almacenamiento (Storage)** (`%0101D01%`) para acumular tambores en memoria durante la recorrida de naves.
   - Código 2: **Sufijo Enter** (`%0107001%`) para enviar retorno tras cada lectura.
4. Para volcar los datos a la pantalla de **Toma por Sectores**, leer el código **Descargar Datos (Upload Data)** (`%0101D02%`).
5. Tras confirmar la conciliación, leer **Borrar Memoria** (`%0101D04%`) para dejar el escáner listo para la siguiente jornada.

---

## 7. Procedimiento para Actualizar el Software

> [!IMPORTANT] **Principio de Aislamiento de Datos**
> El software está diseñado con **separación física estricta** entre el código de la aplicación y la base de datos:
> - El programa se instala en `C:\Archivos de Programa\Olivicola Lujan\...`
> - La base de datos y sus registros residen en `C:\ProgramData\OlivicolaLujan\trazabilidad.sqlite`
> Al instalar una nueva versión, **los datos de tambores, historial y catálogos nunca se sobreescriben ni se eliminan**.

### Procedimiento de Actualización Paso a Paso:

#### Paso 1: Copia de Seguridad Preventiva (Recomendado)
Antes de actualizar, el gerente debe generar un respaldo:
1. Abrir la aplicación con el usuario de Gerencia.
2. Ir a **Configuración** > **Copia de Seguridad y Restauración**.
3. Pulsar **"Descargar Copia de Seguridad JSON"** y guardar el archivo en un pendrive o carpeta segura.
4. *(Opcional)* En la PC Servidor, hacer una copia del archivo `trazabilidad.sqlite`.

#### Paso 2: Actualizar la PC Servidor
1. Cerrar la aplicación en todas las terminales de planta.
2. En la PC Servidor, cerrar el programa.
3. Ejecutar el nuevo instalador provisto (por ejemplo: `OlivicolaLujan-Setup-1.1.0.exe`).
4. El instalador reemplazará los archivos ejecutables manteniendo intacta la base de datos y la configuración de red.
5. Iniciar la aplicación en el Servidor. Si la nueva versión incluye nuevos campos en las tablas, el sistema ejecutará automáticamente una migración de esquema sin requerir comandos técnicos.

#### Paso 3: Actualizar las Terminales
1. En cada PC terminal (balanza, escaneo, oficina), ejecutar el nuevo instalador.
2. Al abrir la nueva versión, la terminal recordará automáticamente la IP del servidor previamente configurada y continuará operando de inmediato.

---

## 8. Plan de Contingencia y Recuperación ante Fallos

- **Si la PC Servidor se avería físicamente:**
  1. Instalar el programa en cualquier otra PC de la empresa.
  2. Activarla en modo Servidor.
  3. Ir a **Configuración** > **Restaurar Copia de Seguridad** y cargar el último archivo `.json` de respaldo.
  4. En las terminales, actualizar la IP apuntando a la nueva máquina. En 5 minutos la planta vuelve a operar al 100%.
- **Copias automáticas recomendadas:**
  Configurar en Windows una tarea programada para copiar diariamente el archivo `C:\ProgramData\OlivicolaLujan\trazabilidad.sqlite` a un disco externo o almacenamiento de red seguro al finalizar el turno de trabajo.
