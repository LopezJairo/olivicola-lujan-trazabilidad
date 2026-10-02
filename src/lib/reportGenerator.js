/**
 * Generador de Informe Ejecutivo de Producción y Métricas en Tiempo Real
 * Olivícola Luján S.A. - Planta Industrial Mendoza (v1.0.6)
 *
 * Consolida la totalidad de existencias, kilos netos, variedades, calibres,
 * calidades y sectores activos a partir de la base de datos viva del sistema.
 */

import { resolveCatalogName, getSuggestedWeightForProduct } from './domain.js';

/**
 * Agrupa y calcula todas las métricas en vivo para el informe ejecutivo.
 */
export function generateExecutiveReportData({
  tambores = [],
  catalogos = [],
  movimientos = [],
  historial = [],
  user = null,
} = {}) {
  const now = new Date();

  // Formato de fecha y hora local
  const dateFormatted = now.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeFormatted = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const pad = (n) => String(n).padStart(2, '0');
  const codeDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const reportCode = `INF-GER-${codeDate}`;

  // 1. Totales Generales
  const totalDrums = tambores.length;
  const totalKg = tambores.reduce((acc, d) => acc + (Number(d.peso) || 0), 0);
  const totalTonnes = (totalKg / 1000).toFixed(1);

  // 2. Mapeos y Contadores de Catálogos
  const prodCatalog = catalogos.filter((c) => c && c.tipo === 'producto');
  const varCatalog = catalogos.filter((c) => c && c.tipo === 'variedad');
  const calCatalog = catalogos.filter((c) => c && c.tipo === 'calibre');
  const qualCatalog = catalogos.filter((c) => c && c.tipo === 'calidad');
  const locCatalog = catalogos.filter((c) => c && c.tipo === 'ubicacion');
  const estCatalog = catalogos.filter((c) => c && c.tipo === 'estado');

  // Helper para buscar código o nombre
  const getCatItem = (catList, idOrCode) => {
    if (!idOrCode) return null;
    return (
      catList.find((c) => c.id === idOrCode || c.codigo === idOrCode) ||
      catList.find((c) => c.nombre?.toLowerCase() === String(idOrCode).toLowerCase())
    );
  };

  // 3. Calidad (Primera, Segunda, Tercera)
  let primeraCount = 0;
  let primeraKg = 0;
  let segundaCount = 0;
  let segundaKg = 0;
  let terceraCount = 0;
  let terceraKg = 0;

  for (const d of tambores) {
    const qItem = getCatItem(qualCatalog, d.calidad);
    const qCode = qItem?.codigo || '';
    const qName = qItem?.nombre || '';
    const weight = Number(d.peso) || 0;

    if (qCode === 'PRI' || qName.toLowerCase().includes('primer')) {
      primeraCount++;
      primeraKg += weight;
    } else if (qCode === 'SDA' || qName.toLowerCase().includes('segund')) {
      segundaCount++;
      segundaKg += weight;
    } else {
      terceraCount++;
      terceraKg += weight;
    }
  }

  const primeraPercent = totalDrums > 0 ? ((primeraCount / totalDrums) * 100).toFixed(1) : '0.0';
  const segundaPercent = totalDrums > 0 ? ((segundaCount / totalDrums) * 100).toFixed(1) : '0.0';
  const terceraPercent = totalDrums > 0 ? ((terceraCount / totalDrums) * 100).toFixed(1) : '0.0';

  // 4. Estados de Proceso y Liberación
  let liberadosCount = 0;
  let observadosCount = 0;
  let fermentacionCount = 0;

  for (const d of tambores) {
    const eItem = getCatItem(estCatalog, d.estado);
    const eName = (eItem?.nombre || d.estado || '').toLowerCase();

    if (eName.includes('liberado') || eName.includes('aprobado')) {
      liberadosCount++;
    } else if (eName.includes('observ') || eName.includes('reten') || eName.includes('cuarent')) {
      observadosCount++;
    } else {
      fermentacionCount++;
    }
  }

  const liberadosPercent = totalDrums > 0 ? ((liberadosCount / totalDrums) * 100).toFixed(1) : '0.0';
  const observadosPercent = totalDrums > 0 ? ((observadosCount / totalDrums) * 100).toFixed(1) : '0.0';
  const fermentacionPercent = totalDrums > 0 ? ((fermentacionCount / totalDrums) * 100).toFixed(1) : '0.0';

  // 5. Desglose de Productos Oficiales
  const productOrder = [
    { codigo: 'ENT', nombre: 'Entera', defaultSugg: 180, desc: 'Estabilidad en Salmuera' },
    { codigo: 'DES', nombre: 'Descarozada', defaultSugg: 140, desc: 'Listo para Envasado / Venta' },
    { codigo: 'FET', nombre: 'Rodajas (Fetas)', defaultSugg: 160, desc: 'Alta Demanda Gastronómica' },
    { codigo: 'GRI', nombre: 'Griegas', defaultSugg: 180, desc: 'Curado Seco / Salmuera' },
    { codigo: 'RELL', nombre: 'Rellenas', defaultSugg: 160, desc: 'Pasta Morrón / Pimiento' },
    { codigo: 'ROTA', nombre: 'Rotas (Pasta)', defaultSugg: 160, desc: 'Destino Tapenade / Aceite' },
  ];

  const productBreakdown = productOrder.map((pDef) => {
    // Buscar tambores que coincidan con este producto
    const matchedDrums = tambores.filter((d) => {
      const pItem = getCatItem(prodCatalog, d.producto);
      return (
        pItem?.codigo === pDef.codigo ||
        pItem?.nombre?.toLowerCase() === pDef.nombre.toLowerCase() ||
        String(d.producto || '').toUpperCase() === pDef.codigo
      );
    });

    const count = matchedDrums.length;
    const kg = matchedDrums.reduce((acc, d) => acc + (Number(d.peso) || 0), 0);
    const percent = totalKg > 0 ? ((kg / totalKg) * 100).toFixed(1) : '0.0';
    const suggested = getSuggestedWeightForProduct(pDef.codigo) || pDef.defaultSugg;

    return {
      codigo: pDef.codigo,
      nombre: pDef.nombre,
      suggestedWeight: `${suggested} kg`,
      drums: count,
      kg,
      percent,
      statusDesc: pDef.desc,
    };
  });

  // 6. Desglose Varietal
  const varietyOrder = [
    { codigo: 'ARA', nombre: 'Arauco', desc: 'Variedad reina mendocina. Mayor calibre y rendimiento.' },
    { codigo: 'ALOR', nombre: 'Aloreña', desc: 'Textura firme para entera verde y partida.' },
    { codigo: 'MF', nombre: 'Manzanilla Fina', desc: 'Homogeneidad ideal para descarozado y rellenas.' },
    { codigo: 'PIC', nombre: 'Picual', desc: 'Alta resistencia a salmueras prolongadas y polifenoles.' },
    { codigo: 'EMP', nombre: 'Empeltre', desc: 'Maduración negra natural y estilo griego.' },
  ];

  const varietyBreakdown = varietyOrder.map((vDef) => {
    const matchedDrums = tambores.filter((d) => {
      const vItem = getCatItem(varCatalog, d.variedad);
      return (
        vItem?.codigo === vDef.codigo ||
        vItem?.nombre?.toLowerCase().includes(vDef.nombre.toLowerCase()) ||
        String(d.variedad || '').toUpperCase() === vDef.codigo
      );
    });

    const count = matchedDrums.length;
    const kg = matchedDrums.reduce((acc, d) => acc + (Number(d.peso) || 0), 0);
    const percent = totalKg > 0 ? ((kg / totalKg) * 100).toFixed(1) : '0.0';

    return {
      codigo: vDef.codigo,
      nombre: vDef.nombre,
      drums: count,
      kg,
      percent,
      desc: vDef.desc,
    };
  });

  // 7. Desglose de Calibres
  const caliberBreakdown = {
    grandes: { label: 'Grandes (80/120 y 121/140)', drums: 0, kg: 0, percent: '0.0', desc: 'Premium Exportación' },
    medios: { label: 'Medios (141/160 a 201/240)', drums: 0, kg: 0, percent: '0.0', desc: 'Mercado Nacional / Granel' },
    chicos: { label: 'Chicos (241/280 a 321/450)', drums: 0, kg: 0, percent: '0.0', desc: 'Fileteado y Rodajas' },
    sinCalibre: { label: 'Sin Calibre (SIN CAL)', drums: 0, kg: 0, percent: '0.0', desc: 'Rotas y Pasta' },
  };

  for (const d of tambores) {
    const cItem = getCatItem(calCatalog, d.calibre);
    const cCode = cItem?.codigo || cItem?.nombre || String(d.calibre || '');
    const weight = Number(d.peso) || 0;

    if (cCode.includes('80/120') || cCode.includes('121/140')) {
      caliberBreakdown.grandes.drums++;
      caliberBreakdown.grandes.kg += weight;
    } else if (
      cCode.includes('141/160') ||
      cCode.includes('161/180') ||
      cCode.includes('161/200') ||
      cCode.includes('181/200') ||
      cCode.includes('201/240')
    ) {
      caliberBreakdown.medios.drums++;
      caliberBreakdown.medios.kg += weight;
    } else if (cCode.includes('241/280') || cCode.includes('281/320') || cCode.includes('321/450')) {
      caliberBreakdown.chicos.drums++;
      caliberBreakdown.chicos.kg += weight;
    } else {
      caliberBreakdown.sinCalibre.drums++;
      caliberBreakdown.sinCalibre.kg += weight;
    }
  }

  if (totalKg > 0) {
    caliberBreakdown.grandes.percent = ((caliberBreakdown.grandes.kg / totalKg) * 100).toFixed(1);
    caliberBreakdown.medios.percent = ((caliberBreakdown.medios.kg / totalKg) * 100).toFixed(1);
    caliberBreakdown.chicos.percent = ((caliberBreakdown.chicos.kg / totalKg) * 100).toFixed(1);
    caliberBreakdown.sinCalibre.percent = ((caliberBreakdown.sinCalibre.kg / totalKg) * 100).toFixed(1);
  }

  // 8. Desglose de Sectores Físicos
  const activeLocationsSet = new Set(tambores.map((d) => d.ubicacion).filter(Boolean));
  const activeLocationsCount = activeLocationsSet.size;

  const locationBreakdown = locCatalog
    .filter((loc) => loc.activo)
    .map((loc) => {
      const matched = tambores.filter((d) => d.ubicacion === loc.id || d.ubicacion === loc.codigo);
      const drums = matched.length;
      const kg = matched.reduce((acc, d) => acc + (Number(d.peso) || 0), 0);
      const percent = totalDrums > 0 ? ((drums / totalDrums) * 100).toFixed(1) : '0.0';
      return {
        id: loc.id,
        codigo: loc.codigo || '—',
        nombre: loc.nombre || loc.codigo,
        drums,
        kg,
        percent,
      };
    })
    .filter((l) => l.drums > 0 || l.codigo.startsWith('NAV') || l.codigo.startsWith('PAT'));

  // Retornar estructura limpia y completa (SIN autoría de personas en documentos ejecutivos)
  return {
    metadata: {
      reportCode,
      dateFormatted,
      timeFormatted,
      emitter: user ? `${user.nombre || user.legajo || 'Operador'} (${user.legajo || 'S/L'})` : 'Gerencia de Planta',
      version: 'v1.0.6 (Estable · Producción)',
    },
    kpis: {
      totalKg,
      totalTonnes,
      totalDrums,
      primeraCount,
      primeraKg,
      primeraPercent,
      segundaCount,
      segundaKg,
      segundaPercent,
      terceraCount,
      terceraKg,
      terceraPercent,
      liberadosCount,
      liberadosPercent,
      observadosCount,
      observadosPercent,
      fermentacionCount,
      fermentacionPercent,
      activeLocationsCount,
      totalMovements: movimientos.length,
    },
    productBreakdown,
    varietyBreakdown,
    caliberBreakdown,
    locationBreakdown,
    recentDrums: tambores.slice(-10).reverse(),
  };
}

/**
 * Construye el documento HTML optimizado para imprimir en tamaño A4 vertical.
 * Garantiza que NO contenga nombres personales y solo firmas institucionales.
 */
export function buildReportHtml(reportData) {
  const { metadata, kpis, productBreakdown, varietyBreakdown, caliberBreakdown, locationBreakdown, recentDrums } = reportData;

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Ejecutivo de Gestión y Trazabilidad - Olivícola Luján S.A.</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 8.5pt;
      line-height: 1.35;
      color: #1A202C;
      background: #FFFFFF;
    }
    .page-container {
      width: 100%;
      max-width: 190mm;
      margin: 0 auto;
    }
    /* Encabezado */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 2pt solid #3B5323;
      padding-bottom: 4mm;
      margin-bottom: 3mm;
    }
    .header-left h1 {
      margin: 0;
      font-size: 17pt;
      font-weight: 800;
      color: #1E2E18;
      letter-spacing: -0.5px;
    }
    .header-left .sub {
      font-size: 7.5pt;
      font-weight: bold;
      color: #607C3C;
      letter-spacing: 0.5px;
      margin-top: 1px;
    }
    .header-right {
      text-align: right;
      font-size: 7.5pt;
      color: #4A5568;
      line-height: 1.3;
    }
    .header-right strong {
      color: #1A202C;
    }
    .doc-title {
      font-size: 11pt;
      font-weight: 800;
      color: #1E2E18;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin: 2mm 0 1mm 0;
    }
    .doc-subtitle {
      font-size: 7.5pt;
      color: #4A5568;
      margin: 0 0 3mm 0;
    }
    /* Grid de KPIs */
    .kpi-grid {
      display: table;
      width: 100%;
      table-layout: fixed;
      margin-bottom: 3.5mm;
      border-spacing: 2.5mm 0;
    }
    .kpi-card {
      display: table-cell;
      background: #F2F5ED;
      border: 0.8pt solid #D5DEC9;
      border-radius: 4px;
      padding: 2.5mm 2mm;
      text-align: center;
      vertical-align: middle;
    }
    .kpi-label {
      font-size: 6.5pt;
      font-weight: 800;
      color: #4A5568;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 1mm;
    }
    .kpi-num {
      font-size: 13.5pt;
      font-weight: 900;
      color: #1E2E18;
      line-height: 1.1;
      margin-bottom: 0.5mm;
    }
    .kpi-sub {
      font-size: 6.8pt;
      color: #607C3C;
      font-weight: 600;
    }
    /* Secciones y Tablas */
    .section-title {
      font-size: 9pt;
      font-weight: 800;
      color: #1E2E18;
      border-left: 3pt solid #3B5323;
      padding-left: 2mm;
      margin: 2.5mm 0 1.5mm 0;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 3mm;
      font-size: 7.2pt;
    }
    table.data-table th {
      background: #3B5323;
      color: #FFFFFF;
      font-weight: 700;
      text-align: left;
      padding: 1.8mm 2mm;
      border: 0.5pt solid #3B5323;
    }
    table.data-table td {
      padding: 1.5mm 2mm;
      border: 0.5pt solid #D5DEC9;
      vertical-align: middle;
    }
    table.data-table tr:nth-child(even) td {
      background: #F9FAF7;
    }
    table.data-table tr.total-row td {
      background: #EAF0E2;
      font-weight: 800;
      border-top: 1.2pt solid #3B5323;
      border-bottom: 1.2pt solid #3B5323;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .bold { font-weight: 700; }
    .mono { font-family: "SF Mono", Menlo, Consolas, monospace; }
    .text-success { color: #2E7D32; font-weight: 600; }
    .text-primary { color: #1565C0; font-weight: 600; }
    /* Dos columnas */
    .two-cols {
      display: table;
      width: 100%;
      table-layout: fixed;
      border-spacing: 3mm 0;
      margin-bottom: 3mm;
    }
    .col-box {
      display: table-cell;
      background: #F9FAF7;
      border: 0.6pt solid #D5DEC9;
      border-radius: 4px;
      padding: 2.5mm 3mm;
      vertical-align: top;
      font-size: 7.2pt;
    }
    .col-box h4 {
      margin: 0 0 1.5mm 0;
      font-size: 7.8pt;
      color: #3B5323;
      font-weight: 800;
      text-transform: uppercase;
    }
    .col-box ul {
      margin: 0;
      padding-left: 3.5mm;
      list-style-type: square;
    }
    .col-box li {
      margin-bottom: 1mm;
      line-height: 1.25;
    }
    /* Salto de página */
    .page-break {
      page-break-before: always;
      break-before: page;
      margin-top: 4mm;
    }
    /* Bloque de Firmas Institucionales */
    .signatures-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5mm;
      margin-bottom: 2mm;
    }
    .signatures-table td {
      width: 33.33%;
      text-align: center;
      padding: 0 4mm;
      vertical-align: top;
    }
    .signature-line {
      border-top: 1pt solid #1A202C;
      width: 80%;
      margin: 0 auto 1.5mm auto;
    }
    .sign-role {
      font-size: 7.5pt;
      font-weight: 800;
      color: #1E2E18;
    }
    .sign-area {
      font-size: 6.5pt;
      color: #718096;
    }
    .confidential-footer {
      border-top: 0.6pt solid #D5DEC9;
      padding-top: 1.5mm;
      margin-top: 3mm;
      font-size: 6.8pt;
      color: #718096;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="page-container">
    <!-- Encabezado Institucional -->
    <table class="header-table">
      <tr>
        <td class="header-left" style="vertical-align: middle;">
          <h1>OLIVÍCOLA LUJÁN S.A.</h1>
          <div class="sub">EST. 1968 · PLANTA INDUSTRIAL MENDOZA</div>
        </td>
        <td class="header-right" style="vertical-align: middle;">
          <strong>DOCUMENTO EJECUTIVO DE PLANTA</strong><br>
          <strong>Fecha:</strong> ${metadata.dateFormatted} (${metadata.timeFormatted})<br>
          <strong>Destinatario:</strong> Directorio & Gerencia General<br>
          <strong>Código de Informe:</strong> ${metadata.reportCode}<br>
          <strong>Emisor:</strong> ${metadata.emitter}
        </td>
      </tr>
    </table>

    <div class="doc-title">INFORME DE GESTIÓN OPERATIVA, STOCK Y TRAZABILIDAD INDUSTRIAL</div>
    <div class="doc-subtitle">
      Balance consolidado en tiempo real de tambores de aceitunas en salmuera, rendimientos por producto, clasificación varietal, calibres y ocupación espacial.
    </div>

    <!-- 1. Tablero de Control / KPIs -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Volumen Neto Total</div>
        <div class="kpi-num">${formatNumber(kpis.totalKg)} kg</div>
        <div class="kpi-sub">${kpis.totalTonnes} Tn en Salmuera</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tambores en Planta</div>
        <div class="kpi-num">${formatNumber(kpis.totalDrums)}</div>
        <div class="kpi-sub">100% con Tambor ID</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Calidad Primera (PRI)</div>
        <div class="kpi-num">${kpis.primeraPercent} %</div>
        <div class="kpi-sub">${formatNumber(kpis.primeraCount)} Tambores Exportación</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Lotes Liberados</div>
        <div class="kpi-num">${kpis.liberadosPercent} %</div>
        <div class="kpi-sub">${formatNumber(kpis.liberadosCount)} Tambores Aptos</div>
      </div>
    </div>

    <!-- 2. Balance por Tipo de Producto -->
    <div class="section-title">1. Balance de Existencias y Rendimiento por Tipo de Producto</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>PRODUCTO</th>
          <th class="text-center">CÓDIGO</th>
          <th class="text-right">PESO ESTÁNDAR</th>
          <th class="text-right">TAMBORES</th>
          <th class="text-right">KILOGRAMOS NETOS</th>
          <th class="text-right">% VOLUMEN</th>
          <th>ESTADO OPERACIONAL</th>
        </tr>
      </thead>
      <tbody>
        ${productBreakdown
          .map(
            (p) => `
        <tr>
          <td class="bold">${p.nombre}</td>
          <td class="text-center mono bold">${p.codigo}</td>
          <td class="text-right">${p.suggestedWeight}</td>
          <td class="text-right bold">${formatNumber(p.drums)}</td>
          <td class="text-right bold">${formatNumber(p.kg)} kg</td>
          <td class="text-right">${p.percent} %</td>
          <td class="text-success">${p.statusDesc}</td>
        </tr>`
          )
          .join('')}
        <tr class="total-row">
          <td class="bold">TOTALES PLANTA</td>
          <td class="text-center">—</td>
          <td class="text-right">—</td>
          <td class="text-right bold">${formatNumber(kpis.totalDrums)}</td>
          <td class="text-right bold">${formatNumber(kpis.totalKg)} kg</td>
          <td class="text-right bold">100,0 %</td>
          <td class="bold">${kpis.totalTonnes} Toneladas Métricas</td>
        </tr>
      </tbody>
    </table>

    <!-- 3. Clasificación Varietal y Calibres -->
    <div class="section-title">2. Clasificación Varietal y Distribución de Calibres</div>
    <div class="two-cols">
      <div class="col-box">
        <h4>Distribución por Variedad Insignia</h4>
        <ul>
          ${varietyBreakdown
            .map(
              (v) => `
            <li>
              <strong>${v.nombre} (${v.codigo}): ${v.percent}%</strong> (${formatNumber(v.kg)} kg · ${v.drums} tambores)<br>
              <span style="color:#718096; font-size:6.8pt;">${v.desc}</span>
            </li>`
            )
            .join('')}
        </ul>
      </div>

      <div class="col-box">
        <h4>Matriz de Calibres (Frutos / kg)</h4>
        <ul>
          <li>
            <strong>${caliberBreakdown.grandes.label}: ${caliberBreakdown.grandes.percent}%</strong> (${formatNumber(caliberBreakdown.grandes.kg)} kg)<br>
            <span style="color:#718096; font-size:6.8pt;">${caliberBreakdown.grandes.desc} (Fruto grande de alta cotización)</span>
          </li>
          <li>
            <strong>${caliberBreakdown.medios.label}: ${caliberBreakdown.medios.percent}%</strong> (${formatNumber(caliberBreakdown.medios.kg)} kg)<br>
            <span style="color:#718096; font-size:6.8pt;">${caliberBreakdown.medios.desc}</span>
          </li>
          <li>
            <strong>${caliberBreakdown.chicos.label}: ${caliberBreakdown.chicos.percent}%</strong> (${formatNumber(caliberBreakdown.chicos.kg)} kg)<br>
            <span style="color:#718096; font-size:6.8pt;">${caliberBreakdown.chicos.desc}</span>
          </li>
          <li>
            <strong>${caliberBreakdown.sinCalibre.label}: ${caliberBreakdown.sinCalibre.percent}%</strong> (${formatNumber(caliberBreakdown.sinCalibre.kg)} kg)<br>
            <span style="color:#718096; font-size:6.8pt;">${caliberBreakdown.sinCalibre.desc}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 4. Distribución por Sectores y Ubicaciones -->
    <div class="section-title">3. Ocupación Espacial y Auditoría por Sectores de Planta</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>SECTOR DE PLANTA</th>
          <th class="text-center">CÓDIGO</th>
          <th class="text-right">TAMBORES AUDITADOS</th>
          <th class="text-right">KILOGRAMOS NETOS</th>
          <th class="text-right">% DEL TOTAL</th>
          <th>ESTADO OPERATIVO</th>
        </tr>
      </thead>
      <tbody>
        ${locationBreakdown
          .map(
            (loc) => `
        <tr>
          <td class="bold">${loc.nombre}</td>
          <td class="text-center mono bold">${loc.codigo}</td>
          <td class="text-right bold">${formatNumber(loc.drums)}</td>
          <td class="text-right">${formatNumber(loc.kg)} kg</td>
          <td class="text-right">${loc.percent} %</td>
          <td class="text-success">Sector Activo y Auditado</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>

    <!-- 5. Auditoría de Calidad y Procesos -->
    <div class="section-title">4. Estado de Lotes y Control Fisicoquímico</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>ESTADO DE PROCESO</th>
          <th class="text-right">CANTIDAD TAMBORES</th>
          <th class="text-right">% DEL STOCK</th>
          <th>DICTAMEN OPERATIVO</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="bold">Lotes Liberados</td>
          <td class="text-right bold">${formatNumber(kpis.liberadosCount)}</td>
          <td class="text-right">${kpis.liberadosPercent} %</td>
          <td class="text-success">Aprobados por Laboratorio para Calibrado / Despacho</td>
        </tr>
        <tr>
          <td class="bold">En Fermentación / Estiba Activa</td>
          <td class="text-right bold">${formatNumber(kpis.fermentacionCount)}</td>
          <td class="text-right">${kpis.fermentacionPercent} %</td>
          <td class="text-primary">Curado regular en salmuera con monitoreo de pH</td>
        </tr>
        <tr>
          <td class="bold">En Observación / Retención Preventiva</td>
          <td class="text-right bold">${formatNumber(kpis.observadosCount)}</td>
          <td class="text-right">${kpis.observadosPercent} %</td>
          <td style="color:#C67D0A; font-weight:600;">Bloqueado preventivo hasta nuevo muestreo</td>
        </tr>
      </tbody>
    </table>

    <!-- 6. Muestreo de Tambores en Planta -->
    ${
      recentDrums && recentDrums.length > 0
        ? `
    <div class="section-title">5. Muestreo de Tambores Registrados y Trazabilidad Unitaria</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>TAMBOR ID</th>
          <th>CÓDIGO DESCRIPTIVO</th>
          <th>LOTE</th>
          <th class="text-right">PESO NETO</th>
          <th>UBICACIÓN</th>
          <th class="text-center">ESTADO</th>
        </tr>
      </thead>
      <tbody>
        ${recentDrums
          .slice(0, 5)
          .map(
            (d) => `
        <tr>
          <td class="bold mono">${d.tambor_id}</td>
          <td class="mono">${d.codigo_descriptivo || d.codigo || '—'}</td>
          <td>${d.lote || '—'}</td>
          <td class="text-right bold">${d.peso} kg</td>
          <td>${d.ubicacion || '—'}</td>
          <td class="text-center text-success">${d.estado || 'Activo'}</td>
        </tr>`
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }

    <!-- Bloque de Firmas Institucionales (SIN firmas personales) -->
    <div style="margin-top: 8mm; padding-top: 2mm;">
      <div style="font-size: 7pt; color: #4A5568; margin-bottom: 7mm; text-align: center;">
        Se certifica la veracidad de los pesajes, calidades y volúmenes asentados en el presente informe conforme al corte del sistema de trazabilidad de Olivícola Luján S.A.
      </div>

      <table class="signatures-table">
        <tr>
          <td>
            <div class="signature-line"></div>
            <div class="sign-role">GERENCIA GENERAL</div>
            <div class="sign-area">Dirección Ejecutiva · Olivícola Luján S.A.</div>
          </td>
          <td>
            <div class="signature-line"></div>
            <div class="sign-role">JEFATURA DE PLANTA</div>
            <div class="sign-area">Operaciones y Logística Industrial</div>
          </td>
          <td>
            <div class="signature-line"></div>
            <div class="sign-role">CONTROL DE CALIDAD</div>
            <div class="sign-area">Laboratorio e Inocuidad Alimentaria</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Pie de página confidencial -->
    <div class="confidential-footer">
      <span>CONFIDENCIAL · Uso exclusivo del Directorio y Gerencia General</span>
      <span>Planta Industrial Luján de Cuyo, Mendoza · Versión 1.0.6</span>
      <span>${metadata.reportCode}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Lanza la impresión del informe en una ventana o iframe limpio configurado en A4.
 */
export function printExecutiveReport(reportData) {
  const html = buildReportHtml(reportData);

  // Intentar abrir en ventana emergente limpia
  try {
    const printWindow = window.open('', '_blank', 'width=950,height=1000');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 350);
      return true;
    }
  } catch (err) {
    console.warn('No se pudo abrir ventana emergente, recurriendo a iframe:', err);
  }

  // Fallback con iframe oculto
  try {
    let iframe = document.getElementById('report-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'report-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow || iframe.contentDocument;
    const targetDoc = doc.document || doc;
    targetDoc.open();
    targetDoc.write(html);
    targetDoc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 350);
    return true;
  } catch (err) {
    console.error('Error al imprimir informe ejecutivo:', err);
    return false;
  }
}
