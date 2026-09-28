# 📦 Portal de Descargas y Actualizaciones — Olivícola Luján

Sitio web ligero, ultra-rápido y optimizado para desplegar en **Vercel** (`https://tudominio.vercel.app`), diseñado para que los operarios, técnicos de calidad y gerencia de **Olivícola Luján** descarguen siempre la última versión oficial del software sin tener que enviarla por WhatsApp o Email.

---

## 🚀 Despliegue en Vercel (En 2 Minutos)

Tienes dos formas sencillas de publicarlo en Vercel:

### Opción 1: Conectar Repositorio de GitHub en Vercel (Recomendada)
1. Sube este proyecto o la carpeta `portal` a tu GitHub.
2. Ingresa a [vercel.com/new](https://vercel.com/new) e importa el repositorio.
3. En la sección **Root Directory**, selecciona `portal`.
4. El framework se detectará automáticamente como **Vite**.
5. Haz clic en **Deploy**. ¡Listo! Vercel te dará una URL permanente como `https://olivicola-lujan-portal.vercel.app`.

### Opción 2: Despliegue Directo con Vercel CLI
Desde la terminal en tu computadora:
```bash
cd portal
vercel
```
Sigue las 3 preguntas en pantalla y luego ejecuta `vercel --prod` para publicarlo en producción.

---

## 💽 ¿Dónde alojar los archivos instaladores (.exe y .dmg)?

Los ejecutables pesan entre 80 MB y 100 MB. Vercel es ideal para la web y la API, mientras que para los archivos binarios grandes recomendamos alojarlos en cualquiera de estas opciones gratuitas con enlaces directos:

1. **GitHub Releases (La mejor opción industrial - Gratis y sin límites):**
   - En tu repositorio de GitHub, ve a **Releases** → **Create a new release** (ej: tag `v1.0.0`).
   - Arrastra los archivos de `dist-electron/`:
     - `Olivicola Lujan Trazabilidad 1.0.0.exe`
     - `Olivicola Lujan Trazabilidad-1.0.0-arm64.dmg`
   - Haz clic en **Publish Release**.
   - Haz clic derecho en el archivo subido → **Copiar dirección de enlace**. Ese enlace directo nunca vence y descarga a máxima velocidad.

2. **Google Drive o OneDrive:**
   - Sube el `.exe` y `.dmg` a una carpeta de Google Drive o OneDrive.
   - Configura el enlace como *"Cualquier persona con el enlace puede ver/descargar"*.
   - Pega ese link en el portal.

3. **Cloudflare R2 / AWS S3 / Dropbox**:
   - También admite cualquier URL pública HTTPS directa.

---

## 🔄 ¿Cómo actualizar las versiones del portal?

Tienes 3 formas inmediatas:

### Forma A: Pídemelo directamente a mí en el chat
Solo dime:
> *"Actualizá el portal a la versión 1.0.1 con este link de Windows: [enlace] y este de Mac: [enlace]"*
Y yo actualizaré automáticamente `portal/public/versions.json` y volveré a compilar.

### Forma B: Usar el panel visual de la Web
1. Entra a la web del portal.
2. En la barra superior, haz clic en el botón **«Gestionar Versiones»**.
3. Ingresa la nueva versión, notas y los nuevos links de descarga.
4. Puedes probarlos al instante y hacer clic en **«Descargar versions.json»** para reemplazar el archivo.

### Forma C: Editar directamente `portal/public/versions.json`
Abre [portal/public/versions.json](file:///Users/jairolopez/Library/CloudStorage/OneDrive-Personal/OlivicolaLujanTrazabilidad/portal/public/versions.json) en cualquier editor, actualiza los campos y al hacer commit a GitHub, Vercel actualizará la página en 15 segundos.

---

## 🛠️ Comandos Locales

- **Probar el portal en local:**
  ```bash
  npm run portal:dev
  ```
  Abre `http://localhost:5174` en el navegador.

- **Compilar para producción:**
  ```bash
  npm run portal:build
  ```
  Genera los archivos estáticos en `portal/dist/`.

- **Previsualizar la compilación de producción:**
  ```bash
  npm run portal:preview
  ```
