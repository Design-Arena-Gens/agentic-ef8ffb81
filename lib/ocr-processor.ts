import { createWorker, Worker } from 'tesseract.js';
import { ExtractedData, ExtractedField } from './types';
import { MRZValidator } from './mrz-validator';

export class OCRProcessor {
  private worker: Worker | null = null;

  async initialize() {
    this.worker = await createWorker('eng');
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }

  async processDocument(imageData: string): Promise<ExtractedData> {
    if (!this.worker) {
      await this.initialize();
    }

    const base64Data = imageData.split(',')[1] || imageData;
    const { data } = await this.worker!.recognize(base64Data);
    const text = data.text;

    const mrzLines = this.extractMRZ(text);
    let parsedMRZ: any = null;
    let mrzConfidence = 0;

    if (mrzLines.length > 0) {
      const mrzResult = MRZValidator.validateMRZ(mrzLines);
      if (mrzResult.valid) {
        parsedMRZ = mrzResult.parsedData;
        mrzConfidence = 95;
      } else {
        mrzConfidence = 60;
        parsedMRZ = mrzResult.parsedData;
      }
    }

    const extractedData = this.extractFields(text, parsedMRZ, mrzConfidence);

    if (mrzLines.length > 0) {
      extractedData.mrzLine1 = { value: mrzLines[0] || '', confidence: mrzConfidence };
      extractedData.mrzLine2 = { value: mrzLines[1] || '', confidence: mrzConfidence };
      if (mrzLines.length > 2) {
        extractedData.mrzLine3 = { value: mrzLines[2] || '', confidence: mrzConfidence };
      }
    }

    return extractedData;
  }

  private extractMRZ(text: string): string[] {
    const lines = text.split('\n').map(line => line.trim());
    const mrzLines: string[] = [];

    for (const line of lines) {
      const cleanLine = line.replace(/\s/g, '').toUpperCase();
      if (cleanLine.length === 44 && /^[A-Z0-9<]+$/.test(cleanLine)) {
        mrzLines.push(cleanLine);
      } else if (cleanLine.length === 30 && /^[A-Z0-9<]+$/.test(cleanLine)) {
        mrzLines.push(cleanLine);
      }
    }

    return mrzLines;
  }

  private extractFields(text: string, parsedMRZ: any, mrzConfidence: number): ExtractedData {
    const lines = text.split('\n');

    const documentType = parsedMRZ?.documentType || this.extractDocumentType(text);
    const documentNumber = parsedMRZ?.documentNumber || this.extractPattern(text, /[A-Z]{1,2}\d{7,9}/);
    const surname = parsedMRZ?.surname || this.extractSurname(text);
    const givenNames = parsedMRZ?.givenNames || this.extractGivenNames(text);
    const nationality = parsedMRZ?.nationality || this.extractPattern(text, /\b([A-Z]{3})\b/);
    const dateOfBirth = parsedMRZ?.dateOfBirth || this.extractDate(text, ['birth', 'born', 'dob']);
    const sex = parsedMRZ?.sex || this.extractSex(text);
    const issuingCountry = parsedMRZ?.issuingCountry || this.extractPattern(text, /\b([A-Z]{3})\b/);
    const issueDate = parsedMRZ?.issueDate || this.extractDate(text, ['issue', 'issued', 'date of issue']);
    const expiryDate = parsedMRZ?.expiryDate || this.extractDate(text, ['expiry', 'expires', 'valid until', 'exp']);

    const baseConfidence = parsedMRZ ? mrzConfidence : 70;

    return {
      documentType: { value: documentType, confidence: parsedMRZ ? mrzConfidence : 80 },
      documentNumber: { value: documentNumber, confidence: parsedMRZ ? mrzConfidence : 75 },
      surname: { value: surname, confidence: parsedMRZ ? mrzConfidence : 75 },
      givenNames: { value: givenNames, confidence: parsedMRZ ? mrzConfidence : 75 },
      nationality: { value: nationality, confidence: parsedMRZ ? mrzConfidence : 80 },
      dateOfBirth: { value: dateOfBirth, confidence: parsedMRZ ? mrzConfidence : 70 },
      sex: { value: sex, confidence: parsedMRZ ? mrzConfidence : 85 },
      issuingCountry: { value: issuingCountry, confidence: parsedMRZ ? mrzConfidence : 80 },
      issueDate: { value: issueDate, confidence: 70 },
      expiryDate: { value: expiryDate, confidence: parsedMRZ ? mrzConfidence : 70 },
    };
  }

  private extractDocumentType(text: string): string {
    const upper = text.toUpperCase();
    if (upper.includes('PASSPORT')) return 'P';
    if (upper.includes('VISA')) return 'V';
    if (upper.includes('IDENTITY') || upper.includes('ID CARD')) return 'I';
    if (upper.includes('DRIVING') || upper.includes('LICENSE') || upper.includes('LICENCE')) return 'D';
    return 'P';
  }

  private extractPattern(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    return match ? match[1] || match[0] : '';
  }

  private extractSurname(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('surname') || lower.includes('last name') || lower.includes('family name')) {
        const parts = line.split(/[:]/);
        if (parts.length > 1) {
          return parts[1].trim().toUpperCase();
        }
      }
    }
    return '';
  }

  private extractGivenNames(text: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('given name') || lower.includes('first name')) {
        const parts = line.split(/[:]/);
        if (parts.length > 1) {
          return parts[1].trim().toUpperCase();
        }
      }
    }
    return '';
  }

  private extractDate(text: string, keywords: string[]): string {
    const lines = text.split('\n');
    for (const line of lines) {
      const lower = line.toLowerCase();
      if (keywords.some(kw => lower.includes(kw))) {
        const dateMatch = line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
        if (dateMatch) {
          let day = dateMatch[1];
          let month = dateMatch[2];
          let year = dateMatch[3];

          if (year.length === 2) {
            year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
          }

          if (day.length === 1) day = `0${day}`;
          if (month.length === 1) month = `0${month}`;

          return `${year}-${month}-${day}`;
        }

        const isoMatch = line.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
          return isoMatch[0];
        }
      }
    }

    const allDates = text.match(/(\d{4})-(\d{2})-(\d{2})/g);
    if (allDates && allDates.length > 0) {
      return allDates[0];
    }

    return new Date().toISOString().split('T')[0];
  }

  private extractSex(text: string): string {
    const upper = text.toUpperCase();
    if (/\bM\b/.test(upper) && !/\bF\b/.test(upper)) return 'M';
    if (/\bF\b/.test(upper) && !/\bM\b/.test(upper)) return 'F';
    if (upper.includes('MALE') && !upper.includes('FEMALE')) return 'M';
    if (upper.includes('FEMALE')) return 'F';
    return 'M';
  }
}
