/**
 * Text Measurement & Typography Constraint Solver
 * 
 * Provides accurate font metrics, line-wrapping, and height calculation
 * without polluting the main DOM, using CanvasRenderingContext2D or OffscreenCanvas.
 * Ensures minTextSize constraints for far viewing distances are strictly honored.
 */

interface TextMeasureResult {
  lines: string[];
  totalHeight: number;
  maxLineWidth: number;
  fontSize: number;
  lineHeight: number;
  isTruncated: boolean;
}

class TextMeasurer {
  private ctx: CanvasRenderingContext2D | null = null;
  private cache: Map<string, TextMeasureResult> = new Map();

  constructor() {
    this.initCanvas();
  }

  private initCanvas() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      this.ctx = canvas.getContext('2d');
    }
  }

  /**
   * Measure text dimensions and calculate wrapped lines under given constraints
   */
  public measureAndWrapText(
    text: string,
    maxWidth: number,
    baseFontSize: number,
    minFontSize: number,
    maxLines: number = 3,
    fontWeight: string = '600',
    fontFamily: string = 'Plus Jakarta Sans, sans-serif'
  ): TextMeasureResult {
    const cacheKey = `${text}_${maxWidth}_${baseFontSize}_${minFontSize}_${maxLines}_${fontWeight}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Try target font size first, scale down to minFontSize if text overflows
    let currentFontSize = Math.max(baseFontSize, minFontSize);
    let bestResult: TextMeasureResult | null = null;

    // Iteratively step down font size if lines exceed maxLines
    while (currentFontSize >= minFontSize) {
      const lineHeight = Math.round(currentFontSize * 1.25);
      const lines = this.breakLines(text, maxWidth, currentFontSize, fontWeight, fontFamily);

      if (lines.length <= maxLines || currentFontSize === minFontSize) {
        let isTruncated = false;
        let finalLines = lines;

        if (finalLines.length > maxLines) {
          finalLines = finalLines.slice(0, maxLines);
          // Add ellipsis to last line
          const lastIndex = maxLines - 1;
          finalLines[lastIndex] = this.truncateWithEllipsis(
            finalLines[lastIndex],
            maxWidth,
            currentFontSize,
            fontWeight,
            fontFamily
          );
          isTruncated = true;
        }

        const maxLineWidth = this.computeMaxLineWidth(finalLines, currentFontSize, fontWeight, fontFamily);
        const totalHeight = finalLines.length * lineHeight;

        bestResult = {
          lines: finalLines,
          totalHeight,
          maxLineWidth,
          fontSize: currentFontSize,
          lineHeight,
          isTruncated
        };
        break;
      }

      currentFontSize -= 1; // Reduce font size step
    }

    if (!bestResult) {
      bestResult = {
        lines: [text],
        totalHeight: Math.round(minFontSize * 1.25),
        maxLineWidth: maxWidth,
        fontSize: minFontSize,
        lineHeight: Math.round(minFontSize * 1.25),
        isTruncated: false
      };
    }

    this.cache.set(cacheKey, bestResult);
    return bestResult;
  }

  private breakLines(
    text: string,
    maxWidth: number,
    fontSize: number,
    fontWeight: string,
    fontFamily: string
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = this.measureWidth(testLine, fontSize, fontWeight, fontFamily);

      if (testWidth <= maxWidth || !currentLine) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }

  private truncateWithEllipsis(
    line: string,
    maxWidth: number,
    fontSize: number,
    fontWeight: string,
    fontFamily: string
  ): string {
    const ellipsis = '...';
    let truncated = line;

    while (truncated.length > 0) {
      const candidate = truncated + ellipsis;
      if (this.measureWidth(candidate, fontSize, fontWeight, fontFamily) <= maxWidth) {
        return candidate;
      }
      truncated = truncated.slice(0, -1).trim();
    }

    return ellipsis;
  }

  private computeMaxLineWidth(
    lines: string[],
    fontSize: number,
    fontWeight: string,
    fontFamily: string
  ): number {
    let max = 0;
    for (const line of lines) {
      const w = this.measureWidth(line, fontSize, fontWeight, fontFamily);
      if (w > max) max = w;
    }
    return Math.ceil(max);
  }

  public measureWidth(
    text: string,
    fontSize: number,
    fontWeight: string = '600',
    fontFamily: string = 'Plus Jakarta Sans, sans-serif'
  ): number {
    if (this.ctx) {
      this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      return this.ctx.measureText(text).width;
    }
    // Reliable fallback for Node / SSR / Vitest environment without Canvas context
    // Average width factor for Latin alphabet in sans-serif is ~0.55 * fontSize
    const weightFactor = fontWeight.includes('bold') || fontWeight === '700' || fontWeight === '800' ? 0.60 : 0.52;
    return text.length * fontSize * weightFactor;
  }
}

export const textMeasurer = new TextMeasurer();
