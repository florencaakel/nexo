"""Gera o relatório desta etapa no estilo do PDF de referência.

Requer ReportLab. Fonte editorial: docs/mvp/RELATORIO-USO-IA-ETAPA-DEMO.md.
Uso: python gerar-relatorio-ia.py /caminho/relatorio.pdf
"""

from pathlib import Path
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/mvp/RELATORIO-USO-IA-ETAPA-DEMO.md"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")


def main():
    output = Path(sys.argv[1])
    output.parent.mkdir(parents=True, exist_ok=True)
    for name, file in [
        ("NexoTimes", "Times New Roman.ttf"),
        ("NexoTimes-Bold", "Times New Roman Bold.ttf"),
        ("NexoTimes-Italic", "Times New Roman Italic.ttf"),
        ("NexoTimes-BoldItalic", "Times New Roman Bold Italic.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / file)))
    pdfmetrics.registerFontFamily(
        "NexoTimes", normal="NexoTimes", bold="NexoTimes-Bold",
        italic="NexoTimes-Italic", boldItalic="NexoTimes-BoldItalic",
    )
    body = ParagraphStyle(
        "body", fontName="NexoTimes", fontSize=12, leading=20.7,
        alignment=TA_JUSTIFY, spaceAfter=12, allowWidows=0, allowOrphans=0,
        splitLongWords=False,
    )
    title = ParagraphStyle(
        "title", parent=body, fontName="NexoTimes-Bold",
        alignment=TA_CENTER, leading=16, spaceAfter=12,
    )
    brand = ParagraphStyle(
        "brand", parent=body, fontName="NexoTimes-BoldItalic",
        alignment=TA_CENTER, textColor=colors.blue, spaceAfter=12,
    )
    authors = ParagraphStyle(
        "authors", parent=body, fontName="NexoTimes-Italic",
        alignment=TA_CENTER, spaceAfter=8,
    )
    stage = ParagraphStyle(
        "stage", parent=body, fontName="NexoTimes-Italic", fontSize=11,
        alignment=TA_CENTER, leading=16, spaceAfter=24,
    )
    heading = ParagraphStyle(
        "heading", parent=body, fontName="NexoTimes-Bold",
        alignment=TA_LEFT, spaceBefore=10, spaceAfter=12, keepWithNext=True,
    )
    subheading = ParagraphStyle(
        "subheading", parent=heading, spaceBefore=5,
    )
    raw = re.sub(r"<!--.*?-->", "", SOURCE.read_text(), flags=re.S).strip()
    blocks = raw.split("\n\n")
    story = [Spacer(1, 18)]
    for index, block in enumerate(blocks):
        text = " ".join(block.splitlines())
        if index == 0:
            style = title
            text = text.removeprefix("# ")
        elif index == 1:
            style = brand
        elif index == 2:
            style = authors
        elif index == 3:
            style = stage
        elif text.startswith("### "):
            style = subheading
            text = text[4:]
        elif text.startswith("## "):
            style = heading
            text = text[3:]
        else:
            style = body
        text = escape(text).replace(
            "aps-nexo.vercel.app",
            '<link href="https://aps-nexo.vercel.app" color="black">aps-nexo.vercel.app</link>',
        )
        story.append(Paragraph(text, style))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("NexoTimes", 10)
        canvas.setFillColor(colors.HexColor("#555555"))
        canvas.drawCentredString(298, 39, str(doc.page))
        canvas.restoreState()

    doc = SimpleDocTemplate(
        str(output), pagesize=(596, 842), rightMargin=66, leftMargin=66,
        topMargin=72, bottomMargin=65,
        title="Nexo - Relatório de uso de IA - Demonstração e retorno da banca",
        author=blocks[2], subject="Etapa concluída em 17/11/2026",
        creator="Nexo - relatório preparado com apoio do Codex",
    )
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(output)


if __name__ == "__main__":
    main()
