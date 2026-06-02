"""
Report generation route — Professional PDF download
Fixes:
  • Windows-safe temp directory (tempfile.mkstemp instead of /tmp)
  • Streams PDF bytes directly → no file-not-found race condition
  • Removed emoji from ReportLab text (crashes some PDF engines)
  • Added crop_type field, weather risk explanation, proper section order
  • Robust fallbacks for every optional field
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import io
import os
import tempfile
from datetime import datetime
from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

router = APIRouter(prefix="/api", tags=["Report"])


# ── Pydantic model ────────────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    disease_name:        str
    confidence:          float          # 0-100 (front-end sends already-multiplied value)
    is_diseased:         bool
    crop_type:           Optional[str]  = None
    # Weather
    temperature:         Optional[float] = None
    humidity:            Optional[float] = None
    wind_speed:          Optional[float] = None
    rainfall:            Optional[float] = None
    weather_condition:   Optional[str]   = None
    location:            Optional[str]   = None
    # Analysis
    risk_score:          Optional[float] = None
    risk_level:          Optional[str]   = None
    recommendation:      Optional[str]   = None
    treatment_options:   Optional[List[str]] = None
    prevention_measures: Optional[List[str]] = None


# ── Helpers ───────────────────────────────────────────────────────────────────
def _fmt_disease(raw: str) -> str:
    if not raw:
        return "Unknown"
    parts = raw.split("___")
    if len(parts) > 1:
        crop    = parts[0].replace("_", " ").title()
        disease = parts[1].replace("_", " ").title()
        return f"{disease} ({crop})"
    return raw.replace("_", " ").title()


def _extract_crop(name: str) -> str:
    if not name:
        return "Unknown"
    return name.split("___")[0].replace("_", " ").title() if "___" in name else name.split("_")[0].title()


def _risk_color_hex(level: str) -> str:
    """Return a plain hex string (no #) for use inside ReportLab XML tags."""
    l = (level or "").lower()
    if "high"   in l: return "c0392b"
    if "medium" in l: return "e67e22"
    return "27ae60"


def _weather_risk_explanation(humidity, temperature, rainfall) -> str:
    parts = []
    h = humidity    or 0
    t = temperature or 0
    r = rainfall    or 0

    if h >= 80:
        parts.append(
            "Humidity is critically high (>= 80%). This creates ideal conditions for "
            "fungal sporulation, bacterial colonisation, and rapid disease spread across "
            "the crop canopy. Immediate preventive action is strongly recommended."
        )
    elif h >= 70:
        parts.append(
            "Humidity is elevated (70-80%), which significantly increases the risk of "
            "fungal and bacterial disease spread. Apply preventive fungicides if not "
            "already done."
        )
    else:
        parts.append(
            "Humidity is within a moderate range. Maintain standard monitoring "
            "frequency and ensure good air circulation between plants."
        )

    if t >= 32:
        parts.append(
            "High temperatures (>= 32 deg C) accelerate pathogen reproduction cycles "
            "and stress crops, reducing natural disease resistance."
        )
    elif t >= 28:
        parts.append(
            "Warm temperatures (28-32 deg C) combined with moisture create favourable "
            "conditions for many fungal pathogens."
        )

    if r >= 5:
        parts.append(
            "Heavy rainfall (>= 5 mm) promotes waterlogging and leaf surface wetness, "
            "key drivers of late blight, downy mildew, and bacterial infections."
        )
    elif r >= 1:
        parts.append(
            "Light rainfall prolongs leaf wetness duration, which can facilitate spore "
            "germination and infection."
        )

    return " ".join(parts) if parts else (
        "Current weather conditions present a low disease risk. "
        "Continue routine monitoring."
    )


def _fallback_treatment(disease_name: str, is_healthy: bool) -> List[str]:
    if is_healthy:
        return []
    return [
        f"Apply Mancozeb 75 WP (2.5 g/L water) as foliar spray every 7-10 days for 3 cycles to control {disease_name}.",
        "For organic management, use neem oil (5 ml/L) with a surfactant early morning or evening.",
        "If root/crown rot is suspected, drench root zone with copper oxychloride (3 g/L).",
        "Avoid spraying under direct sunlight. Monitor plant response after each application.",
    ]


def _fallback_prevention(is_healthy: bool) -> List[str]:
    return [
        "Maintain 30-45 cm plant spacing to ensure air circulation and reduce leaf wetness.",
        "Use drip or furrow irrigation instead of overhead watering.",
        "Rotate crops every season — avoid replanting the same family for 2-3 years.",
        "Source certified, disease-resistant seed varieties suited to your region.",
        "Remove and destroy crop debris after harvest to eliminate overwintering pathogens.",
        "Scout fields twice weekly during high-humidity and rainy periods.",
    ]


# ── PDF builder ───────────────────────────────────────────────────────────────
def _build_pdf(data: ReportRequest) -> bytes:
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        title="Crop Disease Analysis Report",
        author="SmartCrop AI",
    )

    # ── Colour palette ────────────────────────────────────────────────────────
    GREEN_DARK   = colors.HexColor("#1a5c2e")
    GREEN_MID    = colors.HexColor("#2e7d32")
    GREEN_LIGHT  = colors.HexColor("#e8f5e9")
    BLUE_DARK    = colors.HexColor("#0d47a1")
    BLUE_LIGHT   = colors.HexColor("#e3f2fd")
    AMBER        = colors.HexColor("#e65100")
    AMBER_LIGHT  = colors.HexColor("#fff3e0")
    GRAY_LIGHT   = colors.HexColor("#f5f5f5")
    GRAY_MED     = colors.HexColor("#9e9e9e")
    TEXT_DARK    = colors.HexColor("#1a1a1a")
    TEXT_MED     = colors.HexColor("#424242")

    # ── Styles ────────────────────────────────────────────────────────────────
    def _style(name, parent_name="Normal", **kw):
        base = getSampleStyleSheet()[parent_name]
        return ParagraphStyle(name, parent=base, **kw)

    s_title = _style("T", fontSize=26, textColor=GREEN_DARK, alignment=TA_CENTER,
                     fontName="Helvetica-Bold", spaceAfter=4)
    s_sub   = _style("S", fontSize=13, textColor=GREEN_MID, alignment=TA_CENTER,
                     fontName="Helvetica", spaceAfter=4)
    s_meta  = _style("M", fontSize=9, textColor=GRAY_MED, alignment=TA_CENTER,
                     spaceAfter=2)
    s_h     = _style("H", fontSize=12, textColor=GREEN_DARK, fontName="Helvetica-Bold",
                     spaceBefore=10, spaceAfter=6)
    s_body  = _style("B", fontSize=10, textColor=TEXT_MED, leading=15, spaceAfter=4)
    s_bullet= _style("BU", fontSize=10, textColor=TEXT_MED, leading=15, spaceAfter=3,
                     leftIndent=12, bulletIndent=0)
    s_foot  = _style("F", fontSize=8, textColor=GRAY_MED, alignment=TA_CENTER, spaceAfter=2)

    # ── Convenience: section divider ─────────────────────────────────────────
    def divider(c=GREEN_MID, thickness=0.5):
        return HRFlowable(width="100%", thickness=thickness, color=c, spaceAfter=6, spaceBefore=2)

    def section_heading(text):
        return [Paragraph(text, s_h), divider()]

    def bullet_list(items):
        out = []
        for item in (items or []):
            out.append(Paragraph(f"  • {item}", s_bullet))
        return out

    def numbered_list(items):
        out = []
        for i, item in enumerate(items or [], 1):
            out.append(Paragraph(f"  {i}. {item}", s_bullet))
        return out

    def kv_table(rows, header_color=GREEN_MID, header_text_color=colors.white):
        """rows = list of (key, value) tuples; first row is treated as header."""
        tbl = Table(rows, colWidths=[2.1 * inch, 3.6 * inch])
        tbl.setStyle(TableStyle([
            ("BACKGROUND",   (0, 0), (-1, 0), header_color),
            ("TEXTCOLOR",    (0, 0), (-1, 0), header_text_color),
            ("FONTNAME",     (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 0), (-1, 0), 10),
            ("TOPPADDING",   (0, 0), (-1,  0), 7),
            ("BOTTOMPADDING",(0, 0), (-1,  0), 7),
            ("FONTNAME",     (0, 1), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE",     (0, 1), (-1, -1), 10),
            ("TOPPADDING",   (0, 1), (-1, -1), 5),
            ("BOTTOMPADDING",(0, 1), (-1, -1), 5),
            ("ROWBACKGROUNDS",(0, 1), (-1, -1), [colors.white, GRAY_LIGHT]),
            ("GRID",         (0, 0), (-1, -1), 0.4, colors.HexColor("#dddddd")),
            ("ALIGN",        (0, 0), (-1, -1), "LEFT"),
            ("VALIGN",       (0, 0), (-1, -1), "MIDDLE"),
        ]))
        return tbl

    # ── Start building elements ───────────────────────────────────────────────
    E = []
    now_str = datetime.now().strftime("%d %B %Y  %H:%M")
    disease_fmt  = _fmt_disease(data.disease_name)
    crop_name    = data.crop_type or _extract_crop(data.disease_name)
    risk_level   = data.risk_level or "Unknown"
    risk_hex     = _risk_color_hex(risk_level)
    location_str = data.location or "N/A"
    conf_pct     = data.confidence  # already 0-100

    treatment   = data.treatment_options   or _fallback_treatment(disease_fmt, data.is_diseased)
    prevention  = data.prevention_measures or _fallback_prevention(data.is_diseased)
    recommend   = data.recommendation or (
        "Your plant is healthy. Continue current care routines and monitor weekly."
        if not data.is_diseased else
        f"Isolate affected plants immediately to prevent spread of {disease_fmt}. "
        "Remove infected leaves, begin chemical treatment within 24-48 hours, "
        "and recheck all nearby plants for early symptoms."
    )

    # ── HEADER ────────────────────────────────────────────────────────────────
    E.append(Spacer(1, 0.1 * inch))
    E.append(Paragraph("SmartCrop AI", s_sub))
    E.append(Paragraph("Crop Disease Analysis Report", s_title))
    E.append(Spacer(1, 0.05 * inch))
    E.append(Paragraph(f"Generated: {now_str}   |   Location: {location_str}", s_meta))
    E.append(Spacer(1, 0.15 * inch))
    E.append(HRFlowable(width="100%", thickness=2, color=GREEN_DARK, spaceAfter=12))

    # ── SECTION A: PREDICTION SUMMARY ────────────────────────────────────────
    E.extend(section_heading("A.  Prediction Summary"))
    status_text = "DISEASE DETECTED" if data.is_diseased else "HEALTHY PLANT"
    status_color = colors.HexColor("#c0392b") if data.is_diseased else colors.HexColor("#27ae60")
    status_hex = "c0392b" if data.is_diseased else "27ae60"
    tbl_rows = [
        [Paragraph("<b>Field</b>", s_body), Paragraph("<b>Result</b>", s_body)],
        ["Status",           Paragraph(f"<font color='#{status_hex}'><b>{status_text}</b></font>", s_body)],
        ["Crop",             crop_name],
        ["Detected Disease", disease_fmt],
        ["Confidence",       f"{conf_pct:.1f}%"],
        ["Risk Level",       Paragraph(f"<font color='#{risk_hex}'><b>{risk_level}</b></font>", s_body)
                             if risk_level != "Unknown" else risk_level],
    ]
    E.append(kv_table(tbl_rows, header_color=GREEN_MID))
    E.append(Spacer(1, 0.2 * inch))

    # ── SECTION B: WEATHER CONDITIONS ────────────────────────────────────────
    if any(v is not None for v in [data.temperature, data.humidity, data.wind_speed, data.rainfall]):
        E.extend(section_heading("B.  Weather Conditions"))
        w_rows = [
            [Paragraph("<b>Parameter</b>", s_body), Paragraph("<b>Value</b>", s_body)],
        ]
        if data.temperature  is not None: w_rows.append(["Temperature",  f"{data.temperature:.1f} deg C"])
        if data.humidity     is not None: w_rows.append(["Humidity",     f"{data.humidity:.1f}%"])
        if data.wind_speed   is not None: w_rows.append(["Wind Speed",   f"{data.wind_speed:.1f} km/h"])
        if data.rainfall     is not None: w_rows.append(["Rainfall",     f"{data.rainfall:.1f} mm"])
        if data.weather_condition:        w_rows.append(["Condition",    data.weather_condition.title()])
        E.append(kv_table(w_rows, header_color=BLUE_DARK))
        E.append(Spacer(1, 0.15 * inch))

    # ── SECTION C: WEATHER RISK ANALYSIS ─────────────────────────────────────
    E.extend(section_heading("C.  Weather Risk Analysis"))
    risk_explanation = _weather_risk_explanation(data.humidity, data.temperature, data.rainfall)
    if data.risk_score is not None:
        E.append(Paragraph(f"<b>Overall Risk Score:</b> {data.risk_score:.0f} / 100  |  <b>Risk Level:</b> {risk_level}", s_body))
        E.append(Spacer(1, 0.05 * inch))
    E.append(Paragraph(risk_explanation, s_body))
    E.append(Spacer(1, 0.2 * inch))

    # ── SECTION D: IMMEDIATE RECOMMENDATION ──────────────────────────────────
    E.extend(section_heading("D.  Immediate Recommendation"))
    E.append(Paragraph(recommend, s_body))
    if data.is_diseased:
        E.extend(bullet_list([
            "Isolate and mark all visibly affected plants immediately.",
            "Document spread by photographing surrounding plants.",
            "Begin chemical or organic treatment within 24-48 hours.",
            "Inform neighbouring farmers if outbreak risk is High.",
        ]))
    E.append(Spacer(1, 0.2 * inch))

    # ── SECTION E: TREATMENT PLAN ────────────────────────────────────────────
    if treatment:
        E.extend(section_heading("E.  Treatment Plan"))
        E.extend(numbered_list(treatment))
        E.append(Spacer(1, 0.2 * inch))

    # ── SECTION F: PREVENTION STRATEGIES ─────────────────────────────────────
    E.extend(section_heading("F.  Prevention Strategies"))
    E.extend(bullet_list(prevention))
    E.append(Spacer(1, 0.3 * inch))

    # ── FOOTER ────────────────────────────────────────────────────────────────
    E.append(HRFlowable(width="100%", thickness=0.5, color=GRAY_MED, spaceAfter=6))
    E.append(Paragraph("SmartCrop AI  |  Crop Disease Detection System", s_foot))
    E.append(Paragraph(f"Report generated on {now_str}", s_foot))
    E.append(Paragraph(
        "DISCLAIMER: This report is generated by an AI model and is intended as a "
        "decision-support tool only. Always consult a certified agronomist before "
        "applying chemical treatments.",
        s_foot,
    ))

    doc.build(E)
    return buf.getvalue()


# ── POST /api/download-report ─────────────────────────────────────────────────
@router.post("/download-report")
async def download_report(data: ReportRequest):
    """
    Generate a professional PDF crop-disease analysis report and stream it
    directly to the browser as an attachment.
    """
    try:
        pdf_bytes = _build_pdf(data)
        filename  = f"SmartCrop_Report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")
