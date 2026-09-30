const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const out = execSync('printf "protocol=https\\nhost=github.com\\n" | gh auth git-credential get', { encoding: 'utf8' });
    const match = out.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {}
  return '';
}

const TOKEN = getGitHubToken();
const RELEASE_ID = process.env.RELEASE_ID || '399328735';
const REPO = 'LopezJairo/olivicola-lujan-trazabilidad';

const filesToUpload = [
  {
    local: 'dist-electron/Olivicola Lujan Trazabilidad 1.0.4.exe',
    remote: 'Olivicola.Lujan.Trazabilidad.1.0.4.exe',
    mime: 'application/vnd.microsoft.portable-executable',
  },
  {
    local: 'dist-electron/Olivicola Lujan Trazabilidad Setup 1.0.4.exe',
    remote: 'Olivicola.Lujan.Trazabilidad.Setup.1.0.4.exe',
    mime: 'application/vnd.microsoft.portable-executable',
  },
  {
    local: 'dist-electron/Olivicola Lujan Trazabilidad-1.0.4-arm64.dmg',
    remote: 'Olivicola.Lujan.Trazabilidad-1.0.4-arm64.dmg',
    mime: 'application/x-apple-diskimage',
  },
  {
    local: 'dist-electron/Olivicola Lujan Trazabilidad-1.0.4-arm64-mac.zip',
    remote: 'Olivicola.Lujan.Trazabilidad-1.0.4-arm64-mac.zip',
    mime: 'application/zip',
  },
];

async function upload() {
  for (const item of filesToUpload) {
    const filePath = path.resolve(__dirname, '..', item.local);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo local no encontrado: ${filePath}`);
      continue;
    }

    const sizeMb = (fs.statSync(filePath).size / (1024 * 1024)).toFixed(1);
    console.log(`\n⬆️ Subiendo ${item.remote} (${sizeMb} MB) a GitHub Releases...`);

    const uploadUrl = `https://uploads.github.com/repos/${REPO}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(item.remote)}`;

    try {
      execSync(
        `curl -s -L -X POST \
          -H "Authorization: token ${TOKEN}" \
          -H "Content-Type: ${item.mime}" \
          --data-binary "@${filePath}" \
          "${uploadUrl}"`,
        { stdio: 'inherit' }
      );
      console.log(`✅ Subido exitosamente: ${item.remote}`);
    } catch (err) {
      console.error(`❌ Error subiendo ${item.remote}:`, err.message);
    }
  }

  console.log('\n🎉 Todos los binarios han sido subidos a GitHub Releases.');
}

upload();
