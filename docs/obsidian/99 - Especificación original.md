---
title: "99 - Especificación original"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 99 - Especificación original

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Procedencia

Texto original aportado por el usuario en `goal-objective.md`, preservado sin modificar debajo del separador. Es un requerimiento, no un reporte de implementación. La aclaración posterior sobre el MVP para una empresa se registra en [[Olivícola Luján/13 - Decisiones y preguntas abiertas]].

---

crear app con este stack, que sea facil de utilizar y que no haya friccion en la integracion con los operadores, tener en cuenta que su conocimiento tecnologico es casi nulo, entonces la barrera de aprendizaje y uso debe ser muy baja para que puedan utilizarla correctamente, despues obviamnete va a ver unsa seccion que va a ser la operativa donde los comandos y operaciones son mas complejos pero eso lo trabajaran gerentes que entienden el tema, OLIVÍCOLA LUJÁN · Trazabilidad de tambores
Stack tecnológico
Frontend

React 18 + Vite (ESM, JSX)
Tailwind CSS (tokens en src/index.css + mapeo en tailwind.config.js)
shadcn/ui (componentes en src/components/ui/)
lucide-react (iconos)
react-router-dom (rutas)
@tanstack/react-query (estado de datos)
jsbarcode (generación de CODE 128)

Backend / Persistencia

Base de datos por entidades (Tambor, Historial, Movimiento, Catalogo)
Auth (AuthProvider, ProtectedRoute)
Entidades

Tambor — registro de cada tambor (id, códigos, producto, presentación, variedad, calibre, calidad, lote, fechas, peso, ubicación, estado, observaciones)
Historial — eventos por tambor (tipo, campo, valor\_anterior, valor\_nuevo, descripción)
Movimiento — movimientos de ubicación/estado (tipo, ubicación\_anterior, ubicación\_nueva, observaciones)
Catalogo — catálogos configurables (producto, presentacion, variedad, calibre, calidad, ubicacion, estado, tipo\_movimiento) con código, activo y orden
Lógica del programa
Identificación

Cada tambor recibe un ID secuencial T000001… (función nextTamborId).
Código descriptivo = producto\_codigo-presentacion\_codigo-variedad\_codigo-calibre-calidad\_codigo (ej. ENT-VDE-ALOR-161/200-PRI).
Código completo = código\_descriptivo-T000001.
Código de barras CODE 128 generado con jsbarcode desde el código completo.
Catálogos

Ningún valor está hardcodeado: todos provienen de la entidad Catalogo, filtrada por tipo y activo, ordenada por orden.
Se administran en Configuración (alta, edición, activar/desactivar, código).
Nuevo tambor

Formulario carga producto, presentación, variedad, calibre, calidad, lote, fechas, peso, ubicación, estado, observaciones.
Al crear: se calcula el siguiente ID, se arma el código descriptivo y el código completo.
Se persiste el Tambor.
Se registra un Historial "Tambor creado".
Se navega a la ficha.
Editar tambor

Se modifican campos y se guarda.
Se reconstruyen los códigos descriptivo y completo.
Por cada campo cambiado se crea un Historial con campo, valor\_anterior y valor\_nuevo.
La información anterior no se pierde: queda en el historial.
Movimientos

Desde la ficha → Registrar movimiento: tipo (de catálogo), nueva ubicación, observaciones.
Se crea un Movimiento y un Historial "Movimiento: \<tipo>".
Si cambió la ubicación, se actualiza el Tambor y se agrega un Historial "Ubicación modificada".
Eliminar tambor

Desde la ficha → Eliminar: se crea un Historial "Tambor eliminado" y luego se borra el Tambor.
El historial se conserva intacto (rastro de que existió).
Escanear

Campo con autofocus para lector USB (funciona como teclado).
Al Enter: busca por tambor\_id o codigo; si existe abre la ficha, si no, muestra error y limpia.
Inventario

Lista todos los tambores con búsqueda (ID, código, producto, variedad, calibre, lote) y filtros por catálogos.
Muestra totales (cantidad y kg) y navega a la ficha al hacer clic.
Historial

Lista global de eventos ordenados por fecha/hora descendente, con filtro por tambor.
Imprimir etiquetas

Selección de tambores + formato de impresora (ancho/alto en mm, predeterminado 50×100 mm / 5×10 cm).
Imprime una etiqueta por hoja con: código descriptivo, "OLIVÍCOLA LUJÁN", CODE 128, código completo y "Tambor T000001". Sin vista previa.
Etiqueta individual

Desde la ficha → Ver etiqueta: etiqueta única lista para imprimir.
Auth

Login/Register/ForgotPassword/ResetPassword provistos por la interfaz.
ProtectedRoute protege todas las páginas excepto las de auth.
Roles: Administrador y Operario (en la demo no se restringen funciones).
Páginas y rutas
/ Dashboard · /escanear · /inventario · /historial · /configuracion · /tambores/nuevo · /tambores/:id · /tambores/:id/editar · /tambores/:id/etiqueta · /etiquetas · /ayuda
Layout con sidebar (Inicio, Escanear, Inventario, Historial, Configuración, Ayuda).
