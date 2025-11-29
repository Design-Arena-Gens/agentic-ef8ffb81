export class MRZValidator {
  private static readonly WEIGHTS = [7, 3, 1];

  private static charValue(char: string): number {
    if (char >= '0' && char <= '9') return parseInt(char);
    if (char >= 'A' && char <= 'Z') return char.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
    if (char === '<') return 0;
    return 0;
  }

  private static calculateCheckDigit(data: string): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += this.charValue(data[i]) * this.WEIGHTS[i % 3];
    }
    return sum % 10;
  }

  static validateMRZ(mrzLines: string[]): {
    valid: boolean;
    errors: string[];
    parsedData: any;
  } {
    const errors: string[] = [];
    const parsedData: any = {};

    if (mrzLines.length === 2) {
      return this.validateTD3(mrzLines, errors, parsedData);
    } else if (mrzLines.length === 3) {
      return this.validateTD1(mrzLines, errors, parsedData);
    }

    errors.push('Invalid MRZ format - expected 2 or 3 lines');
    return { valid: false, errors, parsedData };
  }

  private static validateTD3(
    mrzLines: string[],
    errors: string[],
    parsedData: any
  ): { valid: boolean; errors: string[]; parsedData: any } {
    const line1 = mrzLines[0];
    const line2 = mrzLines[1];

    if (line1.length !== 44) errors.push(`Line 1 length invalid: ${line1.length}, expected 44`);
    if (line2.length !== 44) errors.push(`Line 2 length invalid: ${line2.length}, expected 44`);

    parsedData.documentType = line1.substring(0, 2).replace(/</g, '');
    parsedData.issuingCountry = line1.substring(2, 5).replace(/</g, '');
    parsedData.surname = line1.substring(5, 44).split('<<')[0].replace(/</g, ' ').trim();
    parsedData.givenNames = line1.substring(5, 44).split('<<')[1]?.replace(/</g, ' ').trim() || '';

    parsedData.documentNumber = line2.substring(0, 9).replace(/</g, '');
    const docNumCheck = line2[9];
    const docNumCalc = this.calculateCheckDigit(line2.substring(0, 9));
    if (docNumCheck !== '<' && parseInt(docNumCheck) !== docNumCalc) {
      errors.push(`Document number check digit failed: expected ${docNumCalc}, got ${docNumCheck}`);
    }

    parsedData.nationality = line2.substring(10, 13).replace(/</g, '');

    const dobStr = line2.substring(13, 19);
    parsedData.dateOfBirth = this.parseMRZDate(dobStr);
    const dobCheck = line2[19];
    const dobCalc = this.calculateCheckDigit(dobStr);
    if (dobCheck !== '<' && parseInt(dobCheck) !== dobCalc) {
      errors.push(`Date of birth check digit failed: expected ${dobCalc}, got ${dobCheck}`);
    }

    parsedData.sex = line2[20];

    const expStr = line2.substring(21, 27);
    parsedData.expiryDate = this.parseMRZDate(expStr);
    const expCheck = line2[27];
    const expCalc = this.calculateCheckDigit(expStr);
    if (expCheck !== '<' && parseInt(expCheck) !== expCalc) {
      errors.push(`Expiry date check digit failed: expected ${expCalc}, got ${expCheck}`);
    }

    const personalNum = line2.substring(28, 42);
    const personalNumCheck = line2[42];
    if (personalNum.replace(/</g, '')) {
      const personalNumCalc = this.calculateCheckDigit(personalNum);
      if (personalNumCheck !== '<' && parseInt(personalNumCheck) !== personalNumCalc) {
        errors.push(`Personal number check digit failed: expected ${personalNumCalc}, got ${personalNumCheck}`);
      }
    }

    const compositeStr = line2.substring(0, 10) + line2.substring(13, 20) + line2.substring(21, 43);
    const compositeCheck = line2[43];
    const compositeCalc = this.calculateCheckDigit(compositeStr);
    if (compositeCheck !== '<' && parseInt(compositeCheck) !== compositeCalc) {
      errors.push(`Composite check digit failed: expected ${compositeCalc}, got ${compositeCheck}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      parsedData,
    };
  }

  private static validateTD1(
    mrzLines: string[],
    errors: string[],
    parsedData: any
  ): { valid: boolean; errors: string[]; parsedData: any } {
    const line1 = mrzLines[0];
    const line2 = mrzLines[1];
    const line3 = mrzLines[2];

    if (line1.length !== 30) errors.push(`Line 1 length invalid: ${line1.length}, expected 30`);
    if (line2.length !== 30) errors.push(`Line 2 length invalid: ${line2.length}, expected 30`);
    if (line3.length !== 30) errors.push(`Line 3 length invalid: ${line3.length}, expected 30`);

    parsedData.documentType = line1.substring(0, 2).replace(/</g, '');
    parsedData.issuingCountry = line1.substring(2, 5).replace(/</g, '');
    parsedData.documentNumber = line1.substring(5, 14).replace(/</g, '');

    const docNumCheck = line1[14];
    const docNumCalc = this.calculateCheckDigit(line1.substring(5, 14));
    if (docNumCheck !== '<' && parseInt(docNumCheck) !== docNumCalc) {
      errors.push(`Document number check digit failed`);
    }

    const dobStr = line2.substring(0, 6);
    parsedData.dateOfBirth = this.parseMRZDate(dobStr);
    const dobCheck = line2[6];
    const dobCalc = this.calculateCheckDigit(dobStr);
    if (dobCheck !== '<' && parseInt(dobCheck) !== dobCalc) {
      errors.push(`Date of birth check digit failed`);
    }

    parsedData.sex = line2[7];

    const expStr = line2.substring(8, 14);
    parsedData.expiryDate = this.parseMRZDate(expStr);
    const expCheck = line2[14];
    const expCalc = this.calculateCheckDigit(expStr);
    if (expCheck !== '<' && parseInt(expCheck) !== expCalc) {
      errors.push(`Expiry date check digit failed`);
    }

    parsedData.nationality = line2.substring(15, 18).replace(/</g, '');

    const names = line3.substring(0, 30).split('<<');
    parsedData.surname = names[0]?.replace(/</g, ' ').trim() || '';
    parsedData.givenNames = names[1]?.replace(/</g, ' ').trim() || '';

    return {
      valid: errors.length === 0,
      errors,
      parsedData,
    };
  }

  private static parseMRZDate(mrzDate: string): string {
    if (mrzDate.length !== 6) return '';
    const year = parseInt(mrzDate.substring(0, 2));
    const month = mrzDate.substring(2, 4);
    const day = mrzDate.substring(4, 6);

    const fullYear = year > 50 ? 1900 + year : 2000 + year;
    return `${fullYear}-${month}-${day}`;
  }
}
