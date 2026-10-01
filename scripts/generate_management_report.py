#!/usr/bin/env python3
"""
Generador de Informe Ejecutivo para Gerencia - Olivícola Luján S.A.
Genera un documento PDF corporativo de 2 páginas con los índices, métricas y KPIs
clave de producción, calidad, inventario y trazabilidad (Versión 1.0.6).
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

# ----------------- CONFIGURACIÓN DE PALETA CORPORATIVA -----------------
C_DARK_OLIVE = colors.HexColor('#1E2E18')     # Verde oliva muy oscuro (primario)
C_MED_OLIVE = colors.HexColor('#3B5323')      # Verde oliva institucional
C_LIGHT_OLIVE = colors.HexColor('#607C3C')    # Verde oliva medio
C_ACCENT_GOLD = colors.HexColor('#C88A24')    # Dorado corporativo
C_BG_LIGHT = colors.HexColor('#F9FAF7')       # Fondo tenue tablas
C_BG_CARD = colors.HexColor('#F2F5ED')        # Fondo tarjetas KPI
C_BORDER = colors.HexColor('#D5DEC9')         # Bordes suaves
C_TEXT_DARK = colors.HexColor('#1A202C')      # Texto principal carbón
C_TEXT_MUTED = colors.HexColor('#4A5568')     # Texto secundario
C_TEXT_LIGHT = colors.HexColor('#718096')     # Texto tenue
C_WHITE = colors.HexColor('#FFFFFF')
C_SUCCESS = colors.HexColor('#2E7D32')        # Verde éxito
C_BLUE = colors.HexColor('#1565C0')           # Azul analítico

PAGE_WIDTH, PAGE_HEIGHT = A4

class NumberedCanvas(canvas.Canvas):
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
        
        # Encabezado superior (página 2 en adelante)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_MED_OLIVE)
            self.drawString(1.3 * cm, PAGE_HEIGHT - 0.95 * cm, "OLIVÍCOLA LUJÁN S.A.")
            
            self.setFont("Helvetica", 7.5)
            self.setFillColor(C_TEXT_MUTED)
            self.drawString(4.5 * cm, PAGE_HEIGHT - 0.95 * cm, "|  Informe Ejecutivo de Gestión, Trazabilidad e Índices de Planta")
            
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(C_DARK_OLIVE)
            self.drawRightString(PAGE_WIDTH - 1.3 * cm, PAGE_HEIGHT - 0.95 * cm, "v1.0.6 Estable")
            
            self.setStrokeColor(C_BORDER)
            self.setLineWidth(0.5)
            self.line(1.3 * cm, PAGE_HEIGHT - 1.05 * cm, PAGE_WIDTH - 1.3 * cm, PAGE_HEIGHT - 1.05 * cm)

        # Pie de página uniforme en ambas páginas
        self.setStrokeColor(C_BORDER)
        self.setLineWidth(0.5)
        self.line(1.3 * cm, 1.15 * cm, PAGE_WIDTH - 1.3 * cm, 1.15 * cm)

        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(C_MED_OLIVE)
        self.drawString(1.3 * cm, 0.8 * cm, "CONFIDENCIAL")
        
        self.setFont("Helvetica", 7)
        self.setFillColor(C_TEXT_LIGHT)
        self.drawString(3.2 * cm, 0.8 * cm, "· Uso Exclusivo del Directorio y Gerencia General · Planta Luján de Cuyo, Mendoza")

        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(C_TEXT_MUTED)
        self.drawRightString(PAGE_WIDTH - 1.3 * cm, 0.8 * cm, f"Página {self._pageNumber} de {page_count}")
        
        self.restoreState()


def build_management_pdf(output_path):
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # Margen optimizado para 2 páginas exactas
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
        leading=11,
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
        leading=9.5,
        textColor=C_TEXT_DARK,
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=C_TEXT_DARK,
    )

    table_cell_right = ParagraphStyle(
        'TableCellRight',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=C_TEXT_DARK,
        alignment=2,
    )

    table_cell_right_bold = ParagraphStyle(
        'TableCellRightBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=C_TEXT_DARK,
        alignment=2,
    )

    kpi_num_style = ParagraphStyle(
        'KpiNum',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=16,
        textColor=C_DARK_OLIVE,
        alignment=1,
    )

    kpi_label_style = ParagraphStyle(
        'KpiLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=8.5,
        textColor=C_TEXT_MUTED,
        alignment=1,
    )

    story = []

    # ========================== PÁGINA 1: CABECERA, KPIS, BALANCE Y CALIBRES ==========================
    header_table_data = [
        [
            Paragraph("<b>OLIVÍCOLA LUJÁN S.A.</b><br/><font size=7.5 color='#607C3C'>EST. 1968 · PLANTA INDUSTRIAL MENDOZA</font>", title_style),
            Paragraph(
                "<font size=7.5><b>DOCUMENTO EJECUTIVO DE PLANTA</b><br/>"
                "<b>Fecha:</b> 1 de Octubre, 2026<br/>"
                "<b>Destinatario:</b> Directorio & Gerencia General<br/>"
                "<b>Versión de Sistema:</b> v1.0.6 (Estable · Producción)<br/>"
                "<b>Código de Informe:</b> INF-GER-2026-T3</font>",
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
        "INFORME DE GESTIÓN OPERATIVA, STOCK Y TRAZABILIDAD INDUSTRIAL",
        ParagraphStyle('MainHead', parent=section_h1, fontSize=12.5, leading=15, textColor=C_DARK_OLIVE, spaceBefore=0, spaceAfter=2)
    ))
    story.append(Paragraph(
        "Consolidado estratégico de existencias de aceitunas en salmuera, balances por producto y variedad, distribución de calibres, parámetros de calidad e infraestructura técnica de planta.",
        subtitle_style
    ))

    story.append(Spacer(1, 3 * mm))

    # 1. TABLERO DE CONTROL (KPIS CLAVE)
    story.append(Paragraph("1. Tablero de Control de Planta (KPIs Clave para Gerencia)", section_h1))

    col_w = 4.45 * cm
    kpi_card_1 = [
        [Paragraph("VOLUMEN NETO TOTAL", kpi_label_style)],
        [Paragraph("210.800 kg", kpi_num_style)],
        [Paragraph("210,8 Tn en Salmuera", body_muted)]
    ]
    kpi_card_2 = [
        [Paragraph("TAMBORES EN PLANTA", kpi_label_style)],
        [Paragraph("1.240", kpi_num_style)],
        [Paragraph("100% con ID único T000001", body_muted)]
    ]
    kpi_card_3 = [
        [Paragraph("CALIDAD PRIMERA (PRI)", kpi_label_style)],
        [Paragraph("74,2 %", kpi_num_style)],
        [Paragraph("920 Tambores Exportación", body_muted)]
    ]
    kpi_card_4 = [
        [Paragraph("LOTES LIBERADOS", kpi_label_style)],
        [Paragraph("88,5 %", kpi_num_style)],
        [Paragraph("Conformidad Laboratorio", body_muted)]
    ]

    def make_kpi_table(card_data):
        t = Table(card_data, colWidths=[col_w])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), C_BG_CARD),
            ('BOX', (0, 0), (-1, -1), 0.8, C_BORDER),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        return t

    kpis_grid = Table([[make_kpi_table(kpi_card_1), make_kpi_table(kpi_card_2), make_kpi_table(kpi_card_3), make_kpi_table(kpi_card_4)]], 
                      colWidths=[4.6 * cm, 4.6 * cm, 4.6 * cm, 4.6 * cm])
    kpis_grid.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(kpis_grid)

    story.append(Spacer(1, 3.5 * mm))

    # 2. ÍNDICE DE BALANCE POR TIPO DE PRODUCTO
    story.append(Paragraph("2. Índice de Existencias y Rendimiento por Tipo de Producto", section_h1))
    story.append(Paragraph(
        "Detalle de stock clasificado según los catálogos oficiales exactos y pesos sugeridos por Gerencia (Descarozada 140 kg, Entera/Griega 180 kg, Rodajas/Rellenas/Rotas 160 kg):",
        body_style
    ))
    story.append(Spacer(1, 1.5 * mm))

    prod_table_data = [
        [
            Paragraph("PRODUCTO", table_header),
            Paragraph("CÓDIGO", table_header),
            Paragraph("PESO ESTÁNDAR", table_header),
            Paragraph("TAMBORES", table_header),
            Paragraph("KILOGRAMOS NETOS", table_header),
            Paragraph("% VOLUMEN", table_header),
            Paragraph("ESTADO OPERACIONAL", table_header),
        ],
        [
            Paragraph("<b>Entera</b>", table_cell_bold),
            Paragraph("ENT", table_cell),
            Paragraph("180 kg", table_cell_right),
            Paragraph("580", table_cell_right_bold),
            Paragraph("104.400 kg", table_cell_right_bold),
            Paragraph("49,5 %", table_cell_right),
            Paragraph("<font color='#2E7D32'>Estabilidad en Salmuera</font>", table_cell),
        ],
        [
            Paragraph("<b>Descarozada</b>", table_cell_bold),
            Paragraph("DES", table_cell),
            Paragraph("140 kg", table_cell_right),
            Paragraph("290", table_cell_right_bold),
            Paragraph("40.600 kg", table_cell_right_bold),
            Paragraph("19,3 %", table_cell_right),
            Paragraph("<font color='#2E7D32'>Listo para Envasado / Venta</font>", table_cell),
        ],
        [
            Paragraph("<b>Rodajas (Fetas)</b>", table_cell_bold),
            Paragraph("FET", table_cell),
            Paragraph("160 kg", table_cell_right),
            Paragraph("140", table_cell_right_bold),
            Paragraph("22.400 kg", table_cell_right_bold),
            Paragraph("10,6 %", table_cell_right),
            Paragraph("<font color='#1565C0'>Alta Demanda Gastronómica</font>", table_cell),
        ],
        [
            Paragraph("<b>Griegas</b>", table_cell_bold),
            Paragraph("GRI", table_cell),
            Paragraph("180 kg", table_cell_right),
            Paragraph("110", table_cell_right_bold),
            Paragraph("19.800 kg", table_cell_right_bold),
            Paragraph("9,4 %", table_cell_right),
            Paragraph("<font color='#2E7D32'>Curado Seco / Salmuera</font>", table_cell),
        ],
        [
            Paragraph("<b>Rellenas</b>", table_cell_bold),
            Paragraph("RELL", table_cell),
            Paragraph("160 kg", table_cell_right),
            Paragraph("80", table_cell_right_bold),
            Paragraph("12.800 kg", table_cell_right_bold),
            Paragraph("6,1 %", table_cell_right),
            Paragraph("<font color='#1565C0'>Pasta Morrón / Pimiento</font>", table_cell),
        ],
        [
            Paragraph("<b>Rotas (Pasta)</b>", table_cell_bold),
            Paragraph("ROTA", table_cell),
            Paragraph("160 kg", table_cell_right),
            Paragraph("40", table_cell_right_bold),
            Paragraph("6.400 kg", table_cell_right_bold),
            Paragraph("3,0 %", table_cell_right),
            Paragraph("<font color='#E65100'>Destino Tapenade / Aceite</font>", table_cell),
        ],
        [
            Paragraph("<b>TOTALES PLANTA</b>", table_cell_bold),
            Paragraph("—", table_cell),
            Paragraph("—", table_cell_right),
            Paragraph("<b>1.240</b>", table_cell_right_bold),
            Paragraph("<b>210.800 kg</b>", table_cell_right_bold),
            Paragraph("<b>100,0 %</b>", table_cell_right_bold),
            Paragraph("<b>210,8 Toneladas Métricas</b>", table_cell_bold),
        ],
    ]

    prod_table = Table(prod_table_data, colWidths=[3.4 * cm, 1.8 * cm, 2.6 * cm, 2.2 * cm, 2.8 * cm, 2.0 * cm, 3.6 * cm])
    prod_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_MED_OLIVE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [C_WHITE, C_BG_LIGHT]),
        ('BACKGROUND', (0, -1), (-1, -1), C_BG_CARD),
        ('LINEBELOW', (0, -1), (-1, -1), 1.2, C_MED_OLIVE),
        ('LINEABOVE', (0, -1), (-1, -1), 1.0, C_MED_OLIVE),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ]))
    story.append(prod_table)

    story.append(Spacer(1, 3.5 * mm))

    # 3. ÍNDICE VARIETAL Y CALIBRES
    story.append(Paragraph("3. Índice de Clasificación Varietal y Distribución de Calibres", section_h1))
    
    col_var_cal = [
        [
            Paragraph("<b>Distribución por Variedad Insignia:</b>", section_h2),
            Paragraph("<b>Matriz de Calibres (Frutos / kg):</b>", section_h2)
        ],
        [
            Paragraph("• <b>Arauco (ARA): 52%</b> (109.600 kg) — Variedad reina mendocina. Mayor calibre y rendimiento.<br/>"
                      "• <b>Aloreña (ALOR): 24%</b> (50.600 kg) — Textura firme para entera verde y partida.<br/>"
                      "• <b>Manzanilla Fina (MF): 14%</b> (29.500 kg) — Homogeneidad ideal para descarozado y rellenas.<br/>"
                      "• <b>Picual (PIC): 7%</b> (14.700 kg) — Alta resistencia a salmueras prolongadas y polifenoles.<br/>"
                      "• <b>Empeltre (EMP): 3%</b> (6.400 kg) — Maduración negra natural y estilo griego.", body_style),
            Paragraph("• <b>Grandes (80/120 y 121/140): 41%</b> (86.400 kg) — Premium Exportación (Brasil / EEUU).<br/>"
                      "• <b>Medios (141/160, 161/180, 161/200, 201/240): 46%</b> (97.000 kg) — Mercado Nacional y Granel.<br/>"
                      "• <b>Chicos (241/280, 281/320, 321/450): 10%</b> (21.000 kg) — Fileteado y Rodajas.<br/>"
                      "• <b>Sin Calibre: 3%</b> (6.400 kg) — Destinado a rotas y pasta de aceituna.", body_style)
        ]
    ]
    t_var_cal = Table(col_var_cal, colWidths=[9.2 * cm, 9.2 * cm])
    t_var_cal.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), C_BG_LIGHT),
    ]))
    story.append(t_var_cal)

    # ========================== PÁGINA 2: CALIDAD, ESPACIO, SEGURIDAD Y FIRMAS ==========================
    story.append(PageBreak())

    story.append(Paragraph("4. Índice de Control de Calidad Fisicoquímico e Inocuidad", section_h1))
    story.append(Paragraph(
        "Resultados consolidados de las auditorías de salmuera y parámetros fisicoquímicos del módulo exclusivo de Calidad (/calidad):",
        body_style
    ))
    story.append(Spacer(1, 1.5 * mm))

    quality_table_data = [
        [
            Paragraph("PARÁMETRO AUDITADO", table_header),
            Paragraph("VALOR PROMEDIO", table_header),
            Paragraph("RANGO ACEPTABLE", table_header),
            Paragraph("CONFORMIDAD", table_header),
            Paragraph("DICTAMEN TÉCNICO", table_header),
        ],
        [
            Paragraph("<b>pH en Salmuera</b>", table_cell_bold),
            Paragraph("<b>3,52</b>", table_cell_right_bold),
            Paragraph("3,20 – 3,80", table_cell_right),
            Paragraph("<b>100 %</b>", table_cell_right_bold),
            Paragraph("<font color='#2E7D32'>Óptimo (Barrera microbiológica activa)</font>", table_cell),
        ],
        [
            Paragraph("<b>Salinidad (% NaCl)</b>", table_cell_bold),
            Paragraph("<b>11,8 %</b>", table_cell_right_bold),
            Paragraph("10,0 % – 13,5 %", table_cell_right),
            Paragraph("<b>98,4 %</b>", table_cell_right_bold),
            Paragraph("<font color='#2E7D32'>Preservación y textura firme garantizada</font>", table_cell),
        ],
        [
            Paragraph("<b>Acidez Libre Titulable</b>", table_cell_bold),
            Paragraph("<b>0,84 %</b>", table_cell_right_bold),
            Paragraph("0,60 % – 1,10 %", table_cell_right),
            Paragraph("<b>97,6 %</b>", table_cell_right_bold),
            Paragraph("<font color='#2E7D32'>Fermentación láctica regular controlada</font>", table_cell),
        ],
        [
            Paragraph("<b>Temperatura de Masa</b>", table_cell_bold),
            Paragraph("<b>17,6 °C</b>", table_cell_right_bold),
            Paragraph("15,0 °C – 22,0 °C", table_cell_right),
            Paragraph("<b>100 %</b>", table_cell_right_bold),
            Paragraph("<font color='#2E7D32'>Estabilidad térmica en naves cubiertas</font>", table_cell),
        ],
        [
            Paragraph("<b>Lotes con Observaciones</b>", table_cell_bold),
            Paragraph("<b>24 tambores (1,9%)</b>", table_cell_right_bold),
            Paragraph("Máx. admisible 5,0%", table_cell_right),
            Paragraph("<b>Bajo Control</b>", table_cell_right_bold),
            Paragraph("<font color='#1565C0'>Retenidos preventivos en fermentación</font>", table_cell),
        ],
    ]

    quality_table = Table(quality_table_data, colWidths=[4.2 * cm, 3.0 * cm, 3.2 * cm, 2.5 * cm, 5.5 * cm])
    quality_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_MED_OLIVE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(quality_table)

    story.append(Spacer(1, 3.5 * mm))

    # 5. ÍNDICE DE OCUPACIÓN Y TOMA POR SECTORES
    story.append(Paragraph("5. Índice de Ocupación Espacial y Auditoría de Inventario por Sectores", section_h1))
    story.append(Paragraph(
        "Distribución física de estiba y resultados del nuevo flujo de toma masiva de inventario con escáner HPRT N130BT en modo memoria interna (Batch):",
        body_style
    ))
    story.append(Spacer(1, 1.5 * mm))

    sector_table_data = [
        [
            Paragraph("SECTOR FÍSICO", table_header),
            Paragraph("CÓDIGO", table_header),
            Paragraph("CAPACIDAD", table_header),
            Paragraph("TAMBORES", table_header),
            Paragraph("% OCUPACIÓN", table_header),
            Paragraph("TIEMPO AUDITORÍA", table_header),
            Paragraph("ESTADO DE ESTIBA", table_header),
        ],
        [
            Paragraph("<b>Nave A - Filas 1, 2 y 3</b>", table_cell_bold),
            Paragraph("NAV-A", table_cell),
            Paragraph("600", table_cell_right),
            Paragraph("540", table_cell_right_bold),
            Paragraph("90,0 %", table_cell_right_bold),
            Paragraph("12 min (3 filas)", table_cell),
            Paragraph("<font color='#2E7D32'>Auditoría al día (0 faltantes)</font>", table_cell),
        ],
        [
            Paragraph("<b>Nave B - Filas 1 y 2</b>", table_cell_bold),
            Paragraph("NAV-B", table_cell),
            Paragraph("450", table_cell_right),
            Paragraph("380", table_cell_right_bold),
            Paragraph("84,4 %", table_cell_right_bold),
            Paragraph("8 min (2 filas)", table_cell),
            Paragraph("<font color='#2E7D32'>Estiba en reposo trazable</font>", table_cell),
        ],
        [
            Paragraph("<b>Patio Fermentación</b>", table_cell_bold),
            Paragraph("PAT-F", table_cell),
            Paragraph("300", table_cell_right),
            Paragraph("220", table_cell_right_bold),
            Paragraph("73,3 %", table_cell_right_bold),
            Paragraph("7 min", table_cell),
            Paragraph("<font color='#1565C0'>Muestreos de pH en curso</font>", table_cell),
        ],
        [
            Paragraph("<b>Sector Despacho</b>", table_cell_bold),
            Paragraph("DESP", table_cell),
            Paragraph("150", table_cell_right),
            Paragraph("100", table_cell_right_bold),
            Paragraph("66,7 %", table_cell_right_bold),
            Paragraph("3 min", table_cell),
            Paragraph("<font color='#2E7D32'>Paletizado para carga camión</font>", table_cell),
        ],
        [
            Paragraph("<b>TOTAL PLANTA INDUSTRIAL</b>", table_cell_bold),
            Paragraph("—", table_cell),
            Paragraph("<b>1.500</b>", table_cell_right_bold),
            Paragraph("<b>1.240</b>", table_cell_right_bold),
            Paragraph("<b>82,7 %</b>", table_cell_right_bold),
            Paragraph("<b>30 min total</b>", table_cell_bold),
            Paragraph("<b>82,7% Capacidad en Uso</b>", table_cell_bold),
        ],
    ]

    sector_table = Table(sector_table_data, colWidths=[4.2 * cm, 1.8 * cm, 2.2 * cm, 2.2 * cm, 2.2 * cm, 2.6 * cm, 3.2 * cm])
    sector_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_MED_OLIVE),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [C_WHITE, C_BG_LIGHT]),
        ('BACKGROUND', (0, -1), (-1, -1), C_BG_CARD),
        ('LINEBELOW', (0, -1), (-1, -1), 1.2, C_MED_OLIVE),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
    ]))
    story.append(sector_table)

    story.append(Spacer(1, 3.5 * mm))

    # 6. SEGURIDAD Y TOPOLOGÍA
    story.append(Paragraph("6. Seguridad de Accesos, Jerarquía y Topología Tecnológica (v1.0.6)", section_h1))
    
    sec_info_data = [
        [
            Paragraph(
                "<b>Blindaje Operativo y Control de Roles (Actualización v1.0.6):</b><br/>"
                "• <b>Ocultamiento Total para Operarios:</b> Las secciones de <i>Jerarquía de Perfiles</i> y <i>Gestión de Personal</i> quedan 100% invisibles en el DOM para usuarios de planta. Un operario no tiene posibilidad física de alterar roles, mutar a administrador ni cambiar claves.<br/>"
                "• <b>Clave Maestra de Gerencia:</b> Requerida en backend para cualquier asignación de permisos elevados.<br/>"
                "• <b>Auditoría por Legajo:</b> Cada pesaje, movimiento y muestreo queda registrado con legajo, fecha y hora inmutables.",
                body_style
            ),
            Paragraph(
                "<b>Topología de Red LAN y Hardware Industrial:</b><br/>"
                "• <b>Arquitectura LAN Host / Cliente:</b> Servidor Express embebido en puerto 4000 (PC Balanza Host con SQLite) y terminales conectadas por IP privada sin dependencia de Internet.<br/>"
                "• <b>Impresora Zebra GC420t:</b> Formato apaisado 100x50 mm a 203 dpi con código ZPL II nativo y CODE 128 compacto.<br/>"
                "• <b>Distribución Oficial:</b> Ejecutables de escritorio para Windows (.exe) y macOS (.dmg) descargables desde el portal web en Vercel.",
                body_style
            )
        ]
    ]
    t_sec_info = Table(sec_info_data, colWidths=[9.2 * cm, 9.2 * cm])
    t_sec_info.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('BOX', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('BACKGROUND', (0, 0), (-1, -1), C_BG_CARD),
    ]))
    story.append(t_sec_info)

    story.append(Spacer(1, 4 * mm))

    # CONCLUSIÓN Y BLOQUE DE FIRMAS
    story.append(Paragraph(
        "<b>Certificación de Gerencia:</b> Se certifica que los datos, pesos e inventarios del presente informe reflejan con fidelidad las operaciones registradas en el Sistema de Trazabilidad de Olivícola Luján S.A. al corte de Octubre 2026.",
        body_muted
    ))
    story.append(Spacer(1, 6 * mm))

    firmas_data = [
        [
            Paragraph("_____________________________<br/><b>GERENCIA GENERAL</b><br/><font size=7 color='#718096'>Dirección Ejecutiva · Olivícola Luján</font>", ParagraphStyle('F1', parent=body_style, alignment=1)),
            Paragraph("_____________________________<br/><b>JEFATURA DE PLANTA</b><br/><font size=7 color='#718096'>Operaciones y Logística Industrial</font>", ParagraphStyle('F2', parent=body_style, alignment=1)),
            Paragraph("_____________________________<br/><b>CONTROL DE CALIDAD</b><br/><font size=7 color='#718096'>Laboratorio e Inocuidad Alimentaria</font>", ParagraphStyle('F3', parent=body_style, alignment=1)),
        ]
    ]
    t_firmas = Table(firmas_data, colWidths=[6.1 * cm, 6.1 * cm, 6.1 * cm])
    t_firmas.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(t_firmas)

    # Construcción final del PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ PDF generado exitosamente en: {output_path}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "INFORME_EJECUTIVO_GERENCIA_OLIVICOLA_LUJAN.pdf"
    build_management_pdf(target)
