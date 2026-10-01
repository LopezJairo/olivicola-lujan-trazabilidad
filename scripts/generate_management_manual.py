#!/usr/bin/env python3
"""
Generador de Manual de Uso y Funcionalidades para Gerencia - Olivícola Luján S.A.
Documento corporativo de 4 páginas con la guía operativa completa y la firma de
autoría y propiedad intelectual de JAIRO LÓPEZ.
"""

import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

# Paleta Corporativa
C_DARK_OLIVE = colors.HexColor('#1E2E18')     # Verde oliva oscuro
C_MED_OLIVE = colors.HexColor('#3B5323')      # Verde oliva institucional
C_LIGHT_OLIVE = colors.HexColor('#607C3C')    # Verde oliva acento
C_ACCENT_GOLD = colors.HexColor('#C88A24')    # Dorado / Mostaza
C_BG_LIGHT = colors.HexColor('#F9FAF7')       # Fondo suave tablas
C_BG_CARD = colors.HexColor('#F2F5ED')        # Fondo tarjetas y cajas
C_BORDER = colors.HexColor('#D5DEC9')         # Bordes
C_TEXT_DARK = colors.HexColor('#1A202C')      # Texto oscuro
C_TEXT_MUTED = colors.HexColor('#4A5568')     # Texto secundario
C_TEXT_LIGHT = colors.HexColor('#718096')     # Texto tenue
C_WHITE = colors.HexColor('#FFFFFF')
C_NAVY = colors.HexColor('#1E3A8A')           # Azul autoría

PAGE_WIDTH, PAGE_HEIGHT = A4

class ManualNumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Encabezado (páginas 2 a 4)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_MED_OLIVE)
            self.drawString(1.3 * cm, PAGE_HEIGHT - 0.95 * cm, "OLIVÍCOLA LUJÁN S.A.")
            
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_TEXT_MUTED)
            self.drawString(4.5 * cm, PAGE_HEIGHT - 0.95 * cm, "|  Manual de Uso y Funcionalidades para la Gerencia")
            
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_NAVY)
            self.drawRightString(PAGE_WIDTH - 1.3 * cm, PAGE_HEIGHT - 0.95 * cm, "Software de Jairo López · v1.0.6")
            
            self.setStrokeColor(C_BORDER)
            self.setLineWidth(0.5)
            self.line(1.3 * cm, PAGE_HEIGHT - 1.05 * cm, PAGE_WIDTH - 1.3 * cm, PAGE_HEIGHT - 1.05 * cm)

        # Pie de página uniforme
        self.setStrokeColor(C_BORDER)
        self.setLineWidth(0.5)
        self.line(1.3 * cm, 1.15 * cm, PAGE_WIDTH - 1.3 * cm, 1.15 * cm)

        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(C_MED_OLIVE)
        self.drawString(1.3 * cm, 0.8 * cm, "MANUAL DE GERENCIA")
        
        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(C_NAVY)
        self.drawString(4.5 * cm, 0.8 * cm, "· Propiedad Intelectual: Jairo López · Todos los derechos reservados")

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(C_TEXT_MUTED)
        self.drawRightString(PAGE_WIDTH - 1.3 * cm, 0.8 * cm, f"Página {self._pageNumber} de {page_count}")
        
        self.restoreState()


def build_manual_pdf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=1.3 * cm,
        rightMargin=1.3 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.3 * cm,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=C_DARK_OLIVE,
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=C_TEXT_MUTED,
    )
    
    section_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=C_DARK_OLIVE,
        spaceBefore=7,
        spaceAfter=3,
    )
    
    section_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=C_MED_OLIVE,
        spaceBefore=3,
        spaceAfter=2,
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.2,
        textColor=C_TEXT_DARK,
    )

    body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11.2,
        textColor=C_TEXT_DARK,
    )

    body_muted = ParagraphStyle(
        'BodyMuted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.5,
        textColor=C_TEXT_MUTED,
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=C_WHITE,
        alignment=1,
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.8,
        textColor=C_TEXT_DARK,
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.8,
        textColor=C_TEXT_DARK,
    )

    ip_box_style = ParagraphStyle(
        'IpBoxStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11,
        textColor=C_DARK_OLIVE,
    )

    story = []

    # ========================== PÁGINA 1: PORTADA, PROPIEDAD INTELECTUAL Y FILOSOFÍA ==========================
    header_table_data = [
        [
            Paragraph("<b>OLIVÍCOLA LUJÁN S.A.</b><br/><font size=7.5 color='#607C3C'>EST. 1968 · PLANTA INDUSTRIAL MENDOZA</font>", title_style),
            Paragraph(
                "<font size=7.5><b>MANUAL OFICIAL DE GERENCIA</b><br/>"
                "<b>Versión de Sistema:</b> v1.0.6 (Estable · Producción)<br/>"
                "<b>Destinado a:</b> Directorio & Gerencia General<br/>"
                "<b>Autoría:</b> Jairo López (Propiedad Intelectual)<br/>"
                "<b>Fecha de Publicación:</b> Octubre 2026</font>",
                subtitle_style
            )
        ]
    ]
    header_table = Table(header_table_data, colWidths=[10.4 * cm, 8.0 * cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(header_table)

    story.append(Spacer(1, 2.5 * mm))
    story.append(HRFlowable(width="100%", thickness=1.5, color=C_MED_OLIVE, spaceBefore=0, spaceAfter=5))

    # Título Principal
    story.append(Paragraph(
        "MANUAL DE USO, FUNCIONALIDADES Y GUÍA OPERATIVA PARA LA GERENCIA",
        ParagraphStyle('MainHead', parent=section_h1, fontSize=12.5, leading=15, textColor=C_DARK_OLIVE, spaceBefore=0, spaceAfter=2)
    ))
    story.append(Paragraph(
        "Guía técnica e instructivo operacional del Sistema de Trazabilidad Industrial de Tambores para la toma de decisiones, supervisión de planta, auditoría y control de procesos.",
        subtitle_style
    ))

    story.append(Spacer(1, 3 * mm))

    # RECUADRO DE PROPIEDAD INTELECTUAL Y AUTORÍA
    ip_table_data = [
        [
            Paragraph(
                "<b>DECLARACIÓN DE AUTORÍA Y PROPIEDAD INTELECTUAL DEL SOFTWARE</b><br/>"
                "El presente software industrial denominado <b>«Sistema de Trazabilidad de Tambores de Olivícola Luján»</b> (versión de escritorio v1.0.6, backend embebido LAN Express + SQLite, módulos de pesaje, toma de inventario por sectores, control de calidad, generación nativa ZPL II y portal de distribución) ha sido íntegramente diseñado, estructurado, programado y desarrollado por <b>JAIRO LÓPEZ</b>.<br/>"
                "<b>Titularidad Exclusiva:</b> Todos los derechos morales, patrimoniales y de propiedad intelectual sobre el código fuente, la lógica algorítmica de deduplicación, los diseños de interfaz y la documentación técnica pertenecen a <b>JAIRO LÓPEZ</b>, habiendo sido provisto para el uso operativo de Olivícola Luján S.A.",
                ip_box_style
            )
        ]
    ]
    t_ip = Table(ip_table_data, colWidths=[18.4 * cm])
    t_ip.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EDF2F7')),
        ('BOX', (0, 0), (-1, -1), 1.2, C_NAVY),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_ip)

    story.append(Spacer(1, 3.5 * mm))

    # 1. VISIÓN GENERAL Y PROPÓSITO DEL SISTEMA
    story.append(Paragraph("1. Propósito y Filosofía del Sistema en Planta", section_h1))
    story.append(Paragraph(
        "El software fue diseñado para resolver una necesidad crítica en las plantas aceituneras de Mendoza: <b>garantizar la trazabilidad total de los tambores en salmuera sin ralentizar el trabajo físico de los operarios</b>.<br/>"
        "• <b>Cero Fricción para Operarios:</b> El personal de balanza y estiba muchas veces cuenta con conocimientos tecnológicos mínimos. El sistema elimina pantallas engorrosas y ventanas confusas. Toda la operación en planta se realiza mediante atajos numéricos directos (teclas 1 a 7) y pistolas lectoras de código de barras.<br/>"
        "• <b>Autonomía e Independencia de Internet:</b> Es una <b>aplicación de escritorio nativa (Electron)</b> con servidor Express y base SQLite embebida. Si se interrumpe la conexión a Internet en la finca, la fábrica continúa operando con normalidad en su red local privada (LAN).<br/>"
        "• <b>Control Gerencial Centralizado:</b> La Gerencia y Calidad disponen de paneles exclusivos para auditar kilos en tiempo real, liberar lotes con parámetros de salmuera y resguardar la base de datos.",
        body_style
    ))

    story.append(Spacer(1, 3.5 * mm))

    # 2. ACCESO Y SEGURIDAD POR LEGAJO (V1.0.6)
    story.append(Paragraph("2. Modelo de Acceso Seguro por Legajo y Niveles de Usuario", section_h1))
    story.append(Paragraph(
        "Cada miembro del personal dispone de un número de <b>Legajo</b> único y una contraseña confidencial. El sistema segmenta los permisos en tres jerarquías estrictas:",
        body_style
    ))
    story.append(Spacer(1, 1.5 * mm))

    roles_table_data = [
        [
            Paragraph("JERARQUÍA / ROL", table_header),
            Paragraph("LEGAJO TIPO", table_header),
            Paragraph("ACCIONES HABILITADAS", table_header),
            Paragraph("BLINDAJE OPERACIONAL (V1.0.6)", table_header),
        ],
        [
            Paragraph("<b>Operador de Planta</b>", table_cell_bold),
            Paragraph("OP-01, OP-02", table_cell),
            Paragraph("Pesaje y alta de tambor, escaneo rápido, toma de inventario por sectores, impresión térmica Zebra.", table_cell),
            Paragraph("<font color='#2E7D32'><b>Modo Protegido:</b> Secciones de roles y gestión de usuarios 100% invisibles en el DOM. Imposibilidad de alterar permisos o claves.</font>", table_cell),
        ],
        [
            Paragraph("<b>Responsable de Calidad</b>", table_cell_bold),
            Paragraph("CAL-01", table_cell),
            Paragraph("Módulo exclusivo (/calidad): muestreo fisicoquímico (pH, salinidad, acidez), retención y liberación de lotes.", table_cell),
            Paragraph("Control técnico de lotes; no puede alterar catálogos de gerencia ni usuarios.", table_cell),
        ],
        [
            Paragraph("<b>Gerente / Administrador</b>", table_cell_bold),
            Paragraph("ADM-01", table_cell),
            Paragraph("Control total: auditoría de personal, catálogos del Excel, servidor LAN, copias de seguridad y blanqueo de claves.", table_cell),
            Paragraph("Protegido con <b>Clave Maestra de Autorización</b> de gerencia para evitar auto-asignación indebida de rangos.", table_cell),
        ],
    ]

    roles_table = Table(roles_table_data, colWidths=[3.2 * cm, 2.0 * cm, 6.7 * cm, 6.5 * cm])
    roles_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_MED_OLIVE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(roles_table)

    # ========================== PÁGINA 2: GUÍA PANTALLA POR PANTALLA (PARTE 1) ==========================
    story.append(PageBreak())

    story.append(Paragraph("3. Guía de Operación Pantalla por Pantalla para la Gerencia", section_h1))
    story.append(Paragraph(
        "A continuación se detallan las pantallas operativas y las acciones que los supervisores y gerentes pueden ejecutar:",
        body_style
    ))
    story.append(Spacer(1, 2 * mm))

    screens_table_data = [
        [
            Paragraph("PANTALLA Y RUTA", table_header),
            Paragraph("ATAJO", table_header),
            Paragraph("PROPÓSITO Y FUNCIONALIDADES CLAVE", table_header),
            Paragraph("UTILIDAD PARA GERENCIA", table_header),
        ],
        [
            Paragraph("<b>Inicio / Panel Principal</b><br/><code>/</code>", table_cell_bold),
            Paragraph("<b>1</b>", table_cell),
            Paragraph("Tablero de mando con indicadores de volumen total en salmuera, cantidad de tambores en planta, distribución por variedad y últimos movimientos.", table_cell),
            Paragraph("<b>Botón de Informe Ejecutivo PDF:</b> Genera en un clic el reporte oficial con todos los índices medibles de planta.", table_cell),
        ],
        [
            Paragraph("<b>Escanear Tambor</b><br/><code>/escanear</code>", table_cell_bold),
            Paragraph("<b>2</b>", table_cell),
            Paragraph("Campo con foco automático constante para lectores USB e inalámbricos. Al presionar el gatillo sobre un tambor, abre inmediatamente su ficha técnica.", table_cell),
            Paragraph("Inspección in situ: permite verificar en segundos qué lote, producto y calidad contiene un tambor en el galpón.", table_cell),
        ],
        [
            Paragraph("<b>Inventario Maestro</b><br/><code>/inventario</code>", table_cell_bold),
            Paragraph("<b>3</b>", table_cell),
            Paragraph("Listado completo de tambores con filtros multicriterio (por lote, variedad, calidad, calibre, sector). Sumatoria dinámica de kilos netos.", table_cell),
            Paragraph("Control de stock valorizado y cálculo exacto de toneladas disponibles para compromisos comerciales de venta.", table_cell),
        ],
        [
            Paragraph("<b>Toma por Sectores</b><br/><code>/inventario/toma</code>", table_cell_bold),
            Paragraph("—", table_cell),
            Paragraph("Módulo de auditoría masiva con escáner HPRT N130BT en modo memoria interna. Se escanea el código del sector (ej. NAV-A1) y luego la fila de tambores.", table_cell),
            Paragraph("<b>Deduplicación automática:</b> El sistema detecta tambores repetidos y actualiza la estiba de 50 tambores en menos de 3 minutos.", table_cell),
        ],
        [
            Paragraph("<b>Registrar Tambor</b><br/><code>/tambores/nuevo</code>", table_cell_bold),
            Paragraph("<b>4</b>", table_cell),
            Paragraph("Formulario de pesaje y alta. Precarga automática de peso sugerido según producto (Descarozada 140 kg, Entera 180 kg, Rodajas/Rellenas 160 kg).", table_cell),
            Paragraph("Asignación de siguiente número único correlativo T000001 e impresión inmediata de la etiqueta térmica.", table_cell),
        ],
        [
            Paragraph("<b>Ficha Técnica y Edición</b><br/><code>/tambores/:id</code>", table_cell_bold),
            Paragraph("—", table_cell),
            Paragraph("Vista detallada con trazabilidad completa. Permite registrar movimientos de ubicación o editar datos asentando cada cambio en el historial.", table_cell),
            Paragraph("Auditoría forense: permite saber quién, cuándo y por qué se modificó cualquier parámetro del tambor.", table_cell),
        ],
    ]

    screens_table = Table(screens_table_data, colWidths=[3.8 * cm, 1.4 * cm, 8.2 * cm, 5.0 * cm])
    screens_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_MED_OLIVE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(screens_table)

    story.append(Spacer(1, 3.5 * mm))

    # 4. CÓDIGOS OFICIALES Y CODE 128
    story.append(Paragraph("4. Estructura de Códigos Estandarizados (Excel de Gerencia)", section_h1))
    story.append(Paragraph(
        "El software implementa al 100% la fórmula oficial provista por la Gerencia General de Olivícola Luján:",
        body_style
    ))
    story.append(Spacer(1, 1.5 * mm))

    codes_box_data = [
        [
            Paragraph(
                "<b>1. CÓDIGO DESCRIPTIVO:</b> <code>ENT-VDE-ALOR-121/140-PRI</code><br/>"
                "• Compuesto por 5 atributos: Producto (ENT) - Presentación (VDE) - Variedad (ALOR) - Calibre (121/140) - Calidad (PRI).<br/>"
                "• Permite al personal de planta y clientes saber exactamente qué contiene el tambor con una simple mirada.<br/>"
                "<b>2. CÓDIGO COMPACTO (BASE CODE 128):</b> <code>ENTVDEALOR121140PRI</code><br/>"
                "• Formato sin guiones ni barras para reducir la densidad de barras en el ancho de 50 mm, facilitando lecturas instantáneas.<br/>"
                "<b>3. CÓDIGO COMPLETO CON IDENTIFICADOR ÚNICO:</b> <code>ENT-VDE-ALOR-121/140-PRI-T000001</code><br/>"
                "• Une el contenido descriptivo con el número de serie irrepetible de tambor, garantizando trazabilidad total.",
                body_style
            )
        ]
    ]
    t_codes = Table(codes_box_data, colWidths=[18.4 * cm])
    t_codes.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_BG_CARD),
        ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(t_codes)

    # ========================== PÁGINA 3: CALIDAD, RED LAN Y HARDWARE ==========================
    story.append(PageBreak())

    story.append(Paragraph("5. Control de Calidad, Hardware Industrial y Red LAN", section_h1))
    story.append(Paragraph(
        "Especificaciones de los módulos técnicos para la supervisión y mantenimiento del sistema por parte de Gerencia:",
        body_style
    ))
    story.append(Spacer(1, 2 * mm))

    tech_table_data = [
        [
            Paragraph("COMPONENTE O MÓDULO", table_header),
            Paragraph("DESCRIPCIÓN Y PROCEDIMIENTO OPERATIVO", table_header),
            Paragraph("RECOMENDACIÓN PARA GERENCIA", table_header),
        ],
        [
            Paragraph("<b>Control de Calidad</b><br/><code>/calidad</code> (Atajo 5)", table_cell_bold),
            Paragraph("Módulo restringido para el responsable de laboratorio. Registra análisis fisicoquímicos por tambor/lote: <b>pH en salmuera</b>, <b>% de Salinidad (NaCl)</b>, <b>Temperatura</b> y <b>Acidez Libre Titulable</b>. Dictamina si el lote queda <i>Liberado</i>, <i>Retenido preventivo</i> o <i>Rechazado</i>.", table_cell),
            Paragraph("Revisar que ningún tambor con estado 'En Observación' sea trasladado a la Nave de Despacho.", table_cell),
        ],
        [
            Paragraph("<b>Impresora Térmica Zebra GC420t</b>", table_cell_bold),
            Paragraph("Impresora industrial desktop de 203 dpi (8 dots/mm). El software genera etiquetas apaisadas de <b>100 mm de ancho × 50 mm de alto</b> con sensor de gap. Emite código de comandos nativo <b>ZPL II</b> (^XA...^XZ) para impresión a velocidad industrial sin desfasajes de papel.", table_cell),
            Paragraph("Comprobar que los rollos de etiquetas mantengan la separación estándar de 3 mm entre etiquetas.", table_cell),
        ],
        [
            Paragraph("<b>Escáner Inalámbrico HPRT N130BT</b>", table_cell_bold),
            Paragraph("Lector láser 2.4G/Bluetooth/USB. Opera en modo directo con sufijo Enter para balanza, y en <b>Modo Almacenamiento Masivo (Batch)</b> para inventario en patios (almacena hasta 50.000 códigos y los descarga en bloque escaneando el código 'Upload Data').", table_cell),
            Paragraph("El manual incluye los códigos de barras de calibración rápida impresos para configurar el lector en 10 segundos.", table_cell),
        ],
        [
            Paragraph("<b>Arquitectura de Red LAN (Host / Cliente)</b>", table_cell_bold),
            Paragraph("• <b>PC Balanza (Servidor Host):</b> Ejecuta el servidor Express en puerto 4000 y aloja la base SQLite (data/olivicola.db).<br/>"
                      "• <b>Terminales Clientes (Naves, Laboratorio):</b> Se conectan ingresando la IP local del Host (ej: http://192.168.1.50:4000). Disponen de botón de prueba de ping reactivo.", table_cell),
            Paragraph("Fijar una <b>dirección IP estática</b> a la computadora de la Balanza en el router o switch de planta.", table_cell),
        ],
        [
            Paragraph("<b>Consola de Diagnóstico</b><br/><code>Cmd + L</code> o <code>Ctrl + L</code>", table_cell_bold),
            Paragraph("Terminal integrada que registra en tiempo real todos los eventos de red, sondeos de sincronización, conexiones de terminales y errores de puerto.", table_cell),
            Paragraph("Permite al técnico diagnosticar problemas de cableado o firewall sin herramientas externas.", table_cell),
        ],
    ]

    tech_table = Table(tech_table_data, colWidths=[4.2 * cm, 9.4 * cm, 4.8 * cm])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_MED_OLIVE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(tech_table)

    story.append(Spacer(1, 3.5 * mm))

    # 6. PROTOCOLO DE RESPALDO Y CONTINGENCIA
    story.append(Paragraph("6. Protocolo de Respaldo de Base de Datos y Contingencias", section_h1))
    story.append(Paragraph(
        "• <b>Copia de Seguridad Diaria JSON:</b> Desde Configuración > <i>Gestión de Datos</i>, presionar <b>«Descargar Copia de Seguridad JSON»</b> al terminar la jornada. Se genera un archivo fechado que resguarda el 100% de tambores, movimientos, historial y catálogos.<br/>"
        "• <b>Restauración Inmediata:</b> Si la computadora principal sufre un daño de hardware, basta con instalar el ejecutable en otra máquina y presionar <b>«Restaurar Copia JSON»</b> para recuperar las operaciones en 10 segundos.<br/>"
        "• <b>Modo Autónomo de Emergencia:</b> Si el cable de red LAN se desconecta, las terminales entran automáticamente en modo offline local, acumulando las operaciones en memoria hasta que la red se reestablezca.",
        body_style
    ))

    # ========================== PÁGINA 4: DISTRIBUCIÓN, PROCEDIMIENTOS Y FIRMA DE AUTORÍA ==========================
    story.append(PageBreak())

    story.append(Paragraph("7. Portal Web de Descarga y Distribución de Ejecutables", section_h1))
    story.append(Paragraph(
        "Para garantizar que todas las computadoras de la planta utilicen la versión más reciente sin riesgos de seguridad, el sistema cuenta con un portal oficial desplegado en la nube de Vercel:<br/>"
        "🌐 <b>Portal de Descargas Oficial:</b> <code>https://portal-lopezjairos-projects.vercel.app</code><br/>"
        "📦 <b>Instaladores Disponibles:</b><br/>"
        "• <b>Windows:</b> <code>Olivicola.Lujan.Trazabilidad.Setup.1.0.6.exe</code> (Instalador completo con accesos directos e integración a Windows).<br/>"
        "• <b>macOS:</b> <code>Olivicola.Lujan.Trazabilidad-1.0.6-arm64.dmg</code> (Paquete optimizado para procesadores Apple Silicon M1/M2/M3/M4).<br/>"
        "• Las actualizaciones se instalan directamente encima de la versión anterior <b>sin riesgo de sobreescritura de la base de datos</b>.",
        body_style
    ))

    story.append(Spacer(1, 4 * mm))

    story.append(Paragraph("8. Resumen de Buenas Prácticas Recomendadas para Gerencia", section_h1))
    story.append(Paragraph(
        "1. <b>Auditoría Semanal de Lotes:</b> Revisar que la sumatoria de kilos en el Dashboard coincida con los remitos de egreso de aceituna procesada.<br/>"
        "2. <b>Control de Bajas:</b> Monitorear periódicamente en el Historial (`/historial`) si hubo tambores dados de baja y exigir el motivo en las observaciones.<br/>"
        "3. <b>Rotación de Clave Maestra:</b> Si un supervisor con privilegios deja de pertenecer al equipo, cambiar la Clave Maestra de Autorización en Configuración.<br/>"
        "4. <b>Calibración de la Balanza:</b> Cotejar periódicamente el pesaje real de la balanza contra los pesos sugeridos del sistema (140, 160 y 180 kg).",
        body_style
    ))

    story.append(Spacer(1, 6 * mm))

    # FIRMA FORMAL DE PROPIEDAD INTELECTUAL Y AUTORÍA
    firma_box_data = [
        [
            Paragraph(
                "<font size=10 color='#1E2E18'><b>DECLARACIÓN FORMAL DE AUTORÍA Y PROPIEDAD INTELECTUAL</b></font><br/><br/>"
                "Se deja expresa constancia de que el presente desarrollo de software, incluyendo su arquitectura de código, "
                "interfaces de usuario, algoritmos de cálculo, esquemas de base de datos, módulos de comunicación industrial y "
                "documentación operativa, es una creación intelectual y obra técnica realizada de forma exclusiva por:<br/><br/>"
                "<font size=11 color='#1E3A8A'><b>JAIRO LÓPEZ</b></font><br/>"
                "<b>Diseñador, Desarrollador de Software y Titular de Derechos Patrimoniales y Morales</b><br/><br/>"
                "Cualquier reproducción, distribución, ingeniería inversa o uso no autorizado fuera de los acuerdos de servicio "
                "establecidos con Olivícola Luján S.A. queda estrictamente prohibido bajo las leyes de propiedad intelectual vigentes.<br/>"
                "<b>Versión Oficial Certificada:</b> v1.0.6 (Octubre 2026) · Planta Industrial Luján de Cuyo, Mendoza, Argentina.",
                ParagraphStyle('FirmaText', parent=body_style, leading=12)
            ),
            Paragraph(
                "<br/><br/>"
                "______________________________________<br/>"
                "<b>FIRMA DE AUTORÍA DE SOFTWARE</b><br/><br/>"
                "<font size=12 color='#1E3A8A'><b>Jairo López</b></font><br/>"
                "<font size=7.5 color='#4A5568'>Lead Software Engineer & Industrial Architect<br/>"
                "Propiedad Exclusiva del Software</font><br/><br/>"
                "<font size=7 color='#718096'>Sellado Digital: JL-OLIVICOLA-2026-V106</font>",
                ParagraphStyle('FirmaRight', parent=body_style, alignment=1, leading=12)
            )
        ]
    ]
    t_firma_box = Table(firma_box_data, colWidths=[10.5 * cm, 7.9 * cm])
    t_firma_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F4F6F0')),
        ('BOX', (0, 0), (-1, -1), 1.2, C_MED_OLIVE),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_firma_box)

    doc.build(story, canvasmaker=ManualNumberedCanvas)
    print(f"✅ Manual de Gerencia generado exitosamente en: {output_path}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "MANUAL_DE_USO_Y_FUNCIONALIDADES_GERENCIA.pdf"
    build_manual_pdf(target)
