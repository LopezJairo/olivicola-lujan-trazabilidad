const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const tmpDist = '/tmp/olivicola-dist-win';
const rootDir = path.resolve(__dirname, '..');
const distElectron = path.join(rootDir, 'dist-electron');

console.log('🚀 Iniciando compilación de Windows en almacenamiento local temporal...');

// 1. Limpiar directorio temporal para evitar interferencia de OneDrive
if (fs.existsSync(tmpDist)) {
  fs.rmSync(tmpDist, { recursive: true, force: true });
}

// 2. Ejecutar electron-builder para Windows apuntando a /tmp
execSync(`npx electron-builder --win --x64 --config.directories.output="${tmpDist}"`, {
  cwd: rootDir,
  stdio: 'inherit',
});

// 3. Crear dist-electron si no existe y copiar ejecutables e instaladores finales
if (!fs.existsSync(distElectron)) {
  fs.mkdirSync(distElectron, { recursive: true });
}

const files = fs.readdirSync(tmpDist);
for (const file of files) {
  if (file.endsWith('.exe') || file.endsWith('.blockmap') || file.endsWith('.zip')) {
    const src = path.join(tmpDist, file);
    const dest = path.join(distElectron, file);
    fs.copyFileSync(src, dest);
    console.log(`📦 Copiado: ${file} -> dist-electron/`);
  }
}

console.log('✅ Compilación de Windows finalizada con éxito.');
