import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import logger from './logger.js';

/**
 * Parse PDF file and extract text content
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @returns {Promise<string>} Extracted text from PDF
 */
export const parsePDF = async (fileBuffer) => {
  try {
    // Set up the worker source for Node.js environment
    // In Node.js, we don't need a separate worker file
    const pdf = pdfjsLib;

    // Load the PDF document from buffer
    const pdfData = new Uint8Array(fileBuffer);
    const doc = await pdf.getDocument({ data: pdfData }).promise;

    let extractedText = '';
    const pageCount = doc.numPages;

    // Extract text from all pages
    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(item => (item.str || ''))
        .join(' ');
      extractedText += pageText + '\n';
    }

    // Clean up text
    const cleanedText = extractedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    if (!cleanedText || cleanedText.length < 3) {
      throw new Error('PDF contains no readable text or is empty');
    }

    logger.info(`[PDF Parser] Successfully extracted ${cleanedText.length} characters from ${pageCount} page(s)`);
    return cleanedText;
  } catch (err) {
    const errorMsg = err?.message || 'Unknown error occurred';
    logger.error(`[PDF Parser] Failed to parse PDF: ${errorMsg}`);
    throw new Error(`Cannot parse PDF: ${errorMsg}`);
  }
};

/**
 * Parse file based on MIME type
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimeType - The MIME type of the file
 * @param {string} filename - Optional filename for context
 * @returns {Promise<string>} Extracted text content
 */
export const parseFile = async (fileBuffer, mimeType, filename = '') => {
  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File buffer is empty');
    }

    logger.info(`[File Parser] Parsing file: ${filename || 'unknown'} (${mimeType})`);

    // Parse PDF files
    if (mimeType === 'application/pdf') {
      return await parsePDF(fileBuffer);
    }

    // For other file types, attempt UTF-8 text extraction
    if (mimeType === 'text/plain' || mimeType === 'text/txt') {
      const text = fileBuffer.toString('utf-8').trim();
      if (!text || text.length < 3) {
        throw new Error('Text file is empty or contains only whitespace');
      }
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    }

    // Fallback: try UTF-8 decoding for unknown types
    const text = fileBuffer.toString('utf-8').trim();
    if (!text || text.length < 3) {
      throw new Error(`Unsupported file type or file is empty: ${mimeType}`);
    }

    logger.warn(`[File Parser] File type ${mimeType} not explicitly supported, using UTF-8 fallback`);
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  } catch (err) {
    const errorMsg = err?.message || 'Unknown error occurred';
    logger.error(`[File Parser] Error parsing file: ${errorMsg}`);
    throw new Error(errorMsg);
  }
};

export default { parsePDF, parseFile };
