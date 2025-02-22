import * as FileSystem from 'expo-file-system';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Buffer } from 'buffer';

interface ConversionOptions {
  title?: string;
  author?: string;
  fontSize?: number;
  lineSpacing?: number;
}

export const conversionService = {
  async textToPDF(text: string, options: ConversionOptions = {}): Promise<string> {
    try {
      const {
        title = 'Scanned Document',
        author = 'DigiFolder',
        fontSize = 12,
        lineSpacing = 1.2
      } = options;

      // Create PDF document
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Set metadata
      pdfDoc.setTitle(title);
      pdfDoc.setAuthor(author);
      pdfDoc.setCreationDate(new Date());

      // Calculate text layout
      const { width, height } = page.getSize();
      const margin = 50;
      const lineHeight = fontSize * lineSpacing;

      // Split text into lines
      const words = text.split(/\s+/);
      const lines: string[] = [];
      let currentLine = '';

      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const lineWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (lineWidth > width - 2 * margin) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);

      // Draw text
      lines.forEach((line, index) => {
        const y = height - margin - (index * lineHeight);
        if (y > margin) { // Ensure we're still on the page
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0)
          });
        }
      });

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const filePath = `${FileSystem.cacheDirectory}${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(filePath, Buffer.from(pdfBytes).toString('base64'), {
        encoding: FileSystem.EncodingType.Base64
      });

      return filePath;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error('Failed to convert to PDF');
    }
  },

  async textToDoc(text: string, options: ConversionOptions = {}): Promise<string> {
    try {
      const {
        title = 'Scanned Document',
        author = 'DigiFolder',
      } = options;

      // Create a simple HTML-based DOCX format
      const htmlContent = `
        <html>
          <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
              body { font-family: Calibri, Arial, sans-serif; }
              p { margin: 0; padding: 0; }
            </style>
          </head>
          <body>
            <p>${text.replace(/\n/g, '</p><p>')}</p>
          </body>
        </html>
      `;

      // Save as HTML file (can be opened in Word)
      const filePath = `${FileSystem.cacheDirectory}${Date.now()}.html`;
      await FileSystem.writeAsStringAsync(filePath, htmlContent);

      return filePath;
    } catch (error) {
      console.error('DOC conversion error:', error);
      throw new Error('Failed to convert to DOC');
    }
  }
}; 