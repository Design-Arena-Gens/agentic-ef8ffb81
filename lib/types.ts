export interface ApplicantData {
  name: string;
  dateOfBirth: string;
  passportNumber: string;
  nationality: string;
  intendedVisaType: string;
}

export interface ExtractedField {
  value: string;
  confidence: number;
}

export interface ExtractedData {
  documentType: ExtractedField;
  documentNumber: ExtractedField;
  surname: ExtractedField;
  givenNames: ExtractedField;
  nationality: ExtractedField;
  dateOfBirth: ExtractedField;
  sex: ExtractedField;
  placeOfBirth?: ExtractedField;
  issuingCountry: ExtractedField;
  issueDate: ExtractedField;
  expiryDate: ExtractedField;
  mrzLine1?: ExtractedField;
  mrzLine2?: ExtractedField;
  mrzLine3?: ExtractedField;
}

export interface ValidationCheck {
  check: string;
  passed: boolean;
  message: string;
}

export interface EligibilityCheck {
  check: string;
  passed: boolean;
  message: string;
}

export interface VerificationResult {
  overallConfidence: number;
  extractedData: ExtractedData;
  validationChecks: ValidationCheck[];
  eligibilityChecks: EligibilityCheck[];
  recommendedActions: string[];
  summary: string;
}

export interface EligibilityPolicy {
  minAge: number;
  maxAge: number;
  allowedNationalities: string[];
  blockedNationalities: string[];
  requiredDocumentTypes: string[];
  minValidityMonths: number;
  visaTypeRequirements: {
    [key: string]: {
      minAge?: number;
      allowedNationalities?: string[];
      additionalRequirements?: string[];
    };
  };
}
