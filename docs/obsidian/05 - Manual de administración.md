---
title: "05 - Manual de administración"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - administracion
  - gerencia
  - seguridad
---

# 05 - Manual de administración

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

La administración del sistema está reservada exclusivamente para usuarios con perfil de **Gerente / Administrador**. Permite gestionar la seguridad de las cuentas de planta, configurar la arquitectura de red, administrar catálogos oficiales y resguardar la base de datos.

---

## 1. Gestión de Personal y Cuentas de Acceso

Desde **Configuración** (`/configuracion`), el Administrador tiene control completo sobre las cuentas de los operadores:

### Dar de Alta un Nuevo Usuario
1. En la sección *Gestión de Personal y Cuentas de Acceso*, presiona **Registrar Personal**.
2. Completa:
   - **Nombre y Apellido:** ej. *Carlos Gómez*.
   - **Número de Legajo:** Identificador único en mayúsculas (ej. `OP-05`, `CAL-02`).
   - **Contraseña Inicial:** Mínimo 3 caracteres.
   - **Rol y Jerarquía:** *Operario*, *Calidad* o *Administrador*.
   - **Puesto o Sector:** ej. *Balanza Principal*, *Nave de Calibrado*.
3. Presiona **Dar de Alta**. La cuenta quedará activa de inmediato.

### Blanqueo o Cambio de Contraseña de un Operario
1. En la tabla de usuarios registrados, ubica al empleado y presiona el botón **Clave**.
2. Escribe la nueva contraseña acordada.
3. Presiona **Guardar Contraseña**.

### Clave Maestra de Autorización de Gerencia
Para prevenir que un usuario cree o eleve cuentas con privilegios jerárquicos indebidamente, el sistema cuenta con la **Clave Maestra de Autorización** (por defecto `LUJAN2026`).
- El Gerente puede modificar esta clave en cualquier momento en el panel de Configuración.
- Dicha clave es requerida para cualquier registro con rango de *Calidad* o *Administrador*.

---

## 2. Jerarquía de Perfiles y Matriz de Permisos

El sistema define 3 niveles jerárquicos estrictos:
1. **Operador de Planta:** Acceso acotado a pesaje, escaneo, inventario por sectores e impresión. **No visualiza las secciones de gestión de personal ni cambio de rol**.
2. **Responsable de Calidad:** Acceso a control de calidad, muestreos, liberación o retención de lotes e impresión.
3. **Gerente / Administrador:** Acceso irrestricto a todas las funciones, catálogos, auditoría, configuración de red y personal.

> [!important] Bloqueo de Conmutación de Roles (v1.0.6)
> Los operarios de planta no pueden bajo ninguna circunstancia alternar roles o auto-asignarse permisos de supervisor. Si una cuenta operario intenta invocar funciones de administración por API, el backend rechaza la petición arrojando un error de permiso denegado (`403 Forbidden`).

---

## 3. Arquitectura de Red y Configuración LAN

El sistema permite operar en dos roles de red según la computadora donde esté instalado:

### Puesto 1: Computadora Principal (Servidor Host)
1. En la PC principal (ej. Balanza de Entrada), abre Configuración > *Arquitectura de Red y Servidor Embebido*.
2. Selecciona **Modo Servidor Host**.
3. Presiona **Arrancar Servidor Embebido**. El sistema activará el servicio en el puerto `4000` (`http://0.0.0.0:4000`) y te indicará las direcciones IP locales de la máquina (ej: `http://192.168.1.50:4000`).
4. Asegúrate de permitir el puerto 4000 en el Firewall de Windows para la red privada.

### Puestos 2, 3 y 4: Terminales Cliente LAN
1. En las demás computadoras de la planta, abre Configuración.
2. Selecciona **Modo Terminal Cliente**.
3. Ingresa la URL de la PC Principal (ej: `http://192.168.1.50:4000`).
4. Presiona **Probar Conexión**. Si responde en milisegundos con estado verde, presiona **Guardar Configuración y Sincronizar**.
5. A partir de ese momento, todas las terminales compartirán la misma base de datos en tiempo real.

---

## 4. Gestión de Catálogos Oficiales

El catálogo garantiza que no existan valores improvisados ni errores ortográficos en los lotes:
- **Productos:** Entera (`ENT`), Descarozada (`DES`), Rodajas (`FET`), Griegas (`GRI`), Rellenas (`RELL`), Rotas (`ROTA`).
- **Presentación:** Verde (`VDE`), Negra (`NN`), Base (`BAS`), Californiana (`CALIF`), Clara (`CL`), Para Griega (`P/GR`), Sin Carozo (`S/C`), Con Pasta (`C/P`), Aceite (`ACEITE`).
- **Variedades:** Aloreña (`ALOR`), Arauco (`ARA`), Manzanilla Fina (`MF`), Picual (`PIC`), Empeltre (`EMP`).
- **Calibres:** Sin Calibre (`SIN CAL`), `80/120`, `121/140`, `141/160`, `161/180`, `181/200`, `161/200`, `201/240`, `241/280`, `281/320`, `321/450`.
- **Calidades:** Primera (`PRI`), Segunda (`SDA`), Tercera (`TRA`).

Para crear o desactivar una opción:
1. Selecciona la pestaña correspondiente en Configuración.
2. Haz clic en **Agregar Opción**.
3. Completa el Nombre y Código (en mayúsculas).
4. Guarda los cambios. Si una opción deja de producirse, edítala y cámbiala a **Inactiva**; esto evitará que se elija en nuevos ingresos sin alterar los tambores antiguos ya registrados.

---

## 5. Respaldos y Copias de Seguridad de la Base de Datos

- **Exportar Respaldo:** Presiona **Descargar Copia de Seguridad JSON** para generar un archivo con fecha y hora que contiene todos los tambores, movimientos, historial y catálogos. Se recomienda realizar esta descarga al finalizar cada jornada.
- **Restaurar Respaldo:** En caso de reemplazo de computadora o contingencia técnica, presiona **Restaurar Copia JSON** y selecciona el archivo de respaldo para recuperar el 100% de la información en segundos.
