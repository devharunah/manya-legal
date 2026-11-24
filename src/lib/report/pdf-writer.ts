import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";

/**
 * A small flowing-text writer on top of pdf-lib: headings, paragraphs,
 * label/value rows and automatic page breaks. Noto Sans is embedded so
 * Luganda letters such as ŋ print correctly.
 */

export interface Fonts {
  regular: Uint8Array;
  bold: Uint8Array;
}

const A4: [number, number] = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.12, 0.1, 0.14);
const MUTED = rgb(0.42, 0.4, 0.45);
const BRAND = rgb(0.18, 0.07, 0.22);

export class PdfWriter {
  private page!: PDFPage;
  private y = 0;
  private pageNumber = 0;

  private constructor(
    readonly doc: PDFDocument,
    private readonly regular: PDFFont,
    private readonly bold: PDFFont,
    private readonly footer: string,
  ) {
    this.newPage();
  }

  static async create(fonts: Fonts, footer: string): Promise<PdfWriter> {
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const regular = await doc.embedFont(fonts.regular, { subset: true });
    const bold = await doc.embedFont(fonts.bold, { subset: true });
    return new PdfWriter(doc, regular, bold, footer);
  }

  private get width() {
    return A4[0] - MARGIN * 2;
  }

  newPage() {
    this.page = this.doc.addPage(A4);
    this.pageNumber += 1;
    this.y = A4[1] - MARGIN;
    this.page.drawText(`${this.footer} · Page ${this.pageNumber}`, {
      x: MARGIN,
      y: MARGIN / 2,
      size: 8,
      font: this.regular,
      color: MUTED,
    });
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN) this.newPage();
  }

  /** Splits text into lines that fit `width`, keeping the author's own line breaks. */
  wrap(text: string, font: PDFFont, size: number, width = this.width): string[] {
    const lines: string[] = [];
    for (const paragraph of text.split(/\r?\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= width) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        // A single word longer than the line (a hash, a URL) is hard-broken.
        let rest = word;
        while (font.widthOfTextAtSize(rest, size) > width) {
          let cut = rest.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(rest.slice(0, cut), size) > width) cut -= 1;
          lines.push(rest.slice(0, cut));
          rest = rest.slice(cut);
        }
        line = rest;
      }
      lines.push(line);
    }
    return lines;
  }

  private lines(
    text: string,
    opts: { size: number; bold?: boolean; color?: ReturnType<typeof rgb>; indent?: number },
  ) {
    const font = opts.bold ? this.bold : this.regular;
    const indent = opts.indent ?? 0;
    const leading = opts.size * 1.4;
    for (const line of this.wrap(text, font, opts.size, this.width - indent)) {
      this.ensure(leading);
      this.y -= leading;
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y,
        size: opts.size,
        font,
        color: opts.color ?? INK,
      });
    }
  }

  title(text: string, subtitle?: string) {
    this.lines(text, { size: 17, bold: true, color: BRAND });
    if (subtitle) this.lines(subtitle, { size: 10, color: MUTED });
    this.gap(8);
  }

  heading(text: string) {
    this.ensure(48);
    this.gap(10);
    this.lines(text, { size: 12, bold: true, color: BRAND });
    this.page.drawLine({
      start: { x: MARGIN, y: this.y - 4 },
      end: { x: MARGIN + this.width, y: this.y - 4 },
      thickness: 0.5,
      color: MUTED,
    });
    this.gap(8);
  }

  paragraph(text: string, opts: { muted?: boolean; size?: number; indent?: number } = {}) {
    this.lines(text, {
      size: opts.size ?? 10,
      color: opts.muted ? MUTED : INK,
      ...(opts.indent ? { indent: opts.indent } : {}),
    });
    this.gap(4);
  }

  /** "Label: value" with an optional provenance tag under the value. */
  field(label: string, value: string, tag?: string) {
    this.lines(label, { size: 8.5, bold: true, color: MUTED });
    this.lines(value, { size: 10.5, indent: 8 });
    if (tag) this.lines(tag, { size: 8, color: MUTED, indent: 8 });
    this.gap(5);
  }

  bullet(text: string) {
    this.lines(`•  ${text}`, { size: 10, indent: 6 });
    this.gap(2);
  }

  gap(points: number) {
    this.y -= points;
  }

  /** Appends every page of an existing PDF (an uploaded original, unchanged). */
  async appendPdf(bytes: Uint8Array) {
    const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await this.doc.copyPages(source, source.getPageIndices());
    for (const p of pages) this.doc.addPage(p);
    this.newPage();
  }

  /** Adds an uploaded image on its own page, scaled to fit, with a caption. */
  async appendImage(bytes: Uint8Array, mimeType: string, caption: string) {
    const image =
      mimeType === "image/png" ? await this.doc.embedPng(bytes) : await this.doc.embedJpg(bytes);
    this.newPage();
    this.lines(caption, { size: 9, bold: true, color: MUTED });
    const maxW = this.width;
    const maxH = this.y - MARGIN - 10;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1);
    const w = image.width * scale;
    const h = image.height * scale;
    this.page.drawImage(image, { x: MARGIN, y: this.y - h - 8, width: w, height: h });
    this.y -= h + 16;
  }

  save(): Promise<Uint8Array> {
    return this.doc.save();
  }
}
