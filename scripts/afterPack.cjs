const { execSync } = require('node:child_process');
const path = require('node:path');

/**
 * afterPack hook para electron-builder en macOS
 * 1. Remueve atributos extendidos (xattr) como com.apple.FinderInfo y FileProvider
 *    que OneDrive/CloudStorage inyecta y que invalidan la firma en macOS ARM64.
 * 2. Aplica firma ad-hoc limpia a todo el paquete .app (incluyendo Frameworks y Helpers)
 *    para que macOS Gatekeeper / Apple Silicon permita la ejecución sin SIGTRAP.
 */
exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== 'darwin') {
    return;
  }

  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`\n[afterPack] Limpiando atributos extendidos y firmando ad-hoc: ${appPath}`);

  try {
    // Limpiar atributos extendidos recursivamente (incluyendo symlinks con -s)
    execSync(`xattr -rc -s "${appPath}"`, { stdio: 'inherit' });
    console.log('[afterPack] Atributos extendidos xattr eliminados con éxito.');
  } catch (err) {
    console.warn('[afterPack] Advertencia al limpiar xattr:', err.message);
  }

  try {
    // Firmar ad-hoc con codesign
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    console.log('[afterPack] Firma ad-hoc aplicada exitosamente a la aplicación.');
  } catch (err) {
    console.warn('[afterPack] Advertencia al firmar con codesign:', err.message);
  }
};
