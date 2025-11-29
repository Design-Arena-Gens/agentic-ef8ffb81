import { ExtractedData, ValidationCheck, ApplicantData, EligibilityCheck, EligibilityPolicy } from './types';

export class DocumentValidator {
  static validateDocument(extractedData: ExtractedData): ValidationCheck[] {
    const checks: ValidationCheck[] = [];

    checks.push(this.checkDocumentExpiry(extractedData));
    checks.push(this.checkDateFormats(extractedData));
    checks.push(this.checkAgeConsistency(extractedData));
    checks.push(this.checkNameFormat(extractedData));
    checks.push(this.checkDocumentNumberFormat(extractedData));
    checks.push(this.checkNationalityFormat(extractedData));
    checks.push(this.checkDateLogic(extractedData));

    return checks;
  }

  private static checkDocumentExpiry(data: ExtractedData): ValidationCheck {
    try {
      const expiryDate = new Date(data.expiryDate.value);
      const today = new Date();
      const isExpired = expiryDate < today;

      return {
        check: 'Document Expiry',
        passed: !isExpired,
        message: isExpired
          ? `Document expired on ${data.expiryDate.value}`
          : `Document valid until ${data.expiryDate.value}`,
      };
    } catch (error) {
      return {
        check: 'Document Expiry',
        passed: false,
        message: 'Invalid expiry date format',
      };
    }
  }

  private static checkDateFormats(data: ExtractedData): ValidationCheck {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dates = [
      { name: 'Date of Birth', value: data.dateOfBirth.value },
      { name: 'Issue Date', value: data.issueDate.value },
      { name: 'Expiry Date', value: data.expiryDate.value },
    ];

    const invalidDates = dates.filter(d => !dateRegex.test(d.value));

    return {
      check: 'Date Format Validation',
      passed: invalidDates.length === 0,
      message:
        invalidDates.length === 0
          ? 'All dates in valid ISO 8601 format'
          : `Invalid date formats: ${invalidDates.map(d => d.name).join(', ')}`,
    };
  }

  private static checkAgeConsistency(data: ExtractedData): ValidationCheck {
    try {
      const dob = new Date(data.dateOfBirth.value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      if (age < 0 || age > 150) {
        return {
          check: 'Age Consistency',
          passed: false,
          message: `Calculated age (${age}) is invalid`,
        };
      }

      return {
        check: 'Age Consistency',
        passed: true,
        message: `Holder age: ${age} years`,
      };
    } catch (error) {
      return {
        check: 'Age Consistency',
        passed: false,
        message: 'Unable to calculate age from date of birth',
      };
    }
  }

  private static checkNameFormat(data: ExtractedData): ValidationCheck {
    const hasValidSurname = data.surname.value.length >= 1;
    const hasValidGivenNames = data.givenNames.value.length >= 1;
    const nameRegex = /^[A-Za-z\s\-']+$/;

    const validFormat =
      nameRegex.test(data.surname.value) &&
      (data.givenNames.value === '' || nameRegex.test(data.givenNames.value));

    return {
      check: 'Name Format',
      passed: hasValidSurname && validFormat,
      message:
        hasValidSurname && validFormat
          ? 'Name format valid'
          : 'Invalid name format or missing required fields',
    };
  }

  private static checkDocumentNumberFormat(data: ExtractedData): ValidationCheck {
    const docNum = data.documentNumber.value;
    const hasValidLength = docNum.length >= 6 && docNum.length <= 12;
    const hasValidChars = /^[A-Z0-9]+$/.test(docNum);

    return {
      check: 'Document Number Format',
      passed: hasValidLength && hasValidChars,
      message:
        hasValidLength && hasValidChars
          ? 'Document number format valid'
          : 'Document number format invalid (should be 6-12 alphanumeric characters)',
    };
  }

  private static checkNationalityFormat(data: ExtractedData): ValidationCheck {
    const nationality = data.nationality.value;
    const isValidCode = /^[A-Z]{3}$/.test(nationality);

    return {
      check: 'Nationality Code Format',
      passed: isValidCode,
      message: isValidCode
        ? `Valid nationality code: ${nationality}`
        : 'Invalid nationality code (should be 3-letter ISO code)',
    };
  }

  private static checkDateLogic(data: ExtractedData): ValidationCheck {
    try {
      const dob = new Date(data.dateOfBirth.value);
      const issueDate = new Date(data.issueDate.value);
      const expiryDate = new Date(data.expiryDate.value);

      const dobBeforeIssue = dob < issueDate;
      const issueBeforeExpiry = issueDate < expiryDate;
      const dobNotFuture = dob < new Date();

      const allValid = dobBeforeIssue && issueBeforeExpiry && dobNotFuture;

      return {
        check: 'Date Logic',
        passed: allValid,
        message: allValid
          ? 'All dates are logically consistent'
          : 'Date sequence error: dates are not in logical order',
      };
    } catch (error) {
      return {
        check: 'Date Logic',
        passed: false,
        message: 'Unable to validate date logic',
      };
    }
  }

  static checkEligibility(
    extractedData: ExtractedData,
    applicantData: ApplicantData,
    policy: EligibilityPolicy
  ): EligibilityCheck[] {
    const checks: EligibilityCheck[] = [];

    checks.push(this.checkNameMatch(extractedData, applicantData));
    checks.push(this.checkDOBMatch(extractedData, applicantData));
    checks.push(this.checkPassportNumberMatch(extractedData, applicantData));
    checks.push(this.checkNationalityMatch(extractedData, applicantData));
    checks.push(this.checkAgeRequirements(extractedData, applicantData, policy));
    checks.push(this.checkNationalityEligibility(extractedData, policy));
    checks.push(this.checkDocumentType(extractedData, policy));
    checks.push(this.checkValidityPeriod(extractedData, policy));
    checks.push(this.checkVisaTypeRequirements(extractedData, applicantData, policy));

    return checks;
  }

  private static checkNameMatch(data: ExtractedData, applicant: ApplicantData): EligibilityCheck {
    const extractedFullName = `${data.givenNames.value} ${data.surname.value}`.toLowerCase().trim();
    const applicantName = applicant.name.toLowerCase().trim();

    const match = extractedFullName === applicantName;

    return {
      check: 'Name Match',
      passed: match,
      message: match
        ? 'Applicant name matches document'
        : `Name mismatch: Document shows "${extractedFullName}", applicant claims "${applicantName}"`,
    };
  }

  private static checkDOBMatch(data: ExtractedData, applicant: ApplicantData): EligibilityCheck {
    const match = data.dateOfBirth.value === applicant.dateOfBirth;

    return {
      check: 'Date of Birth Match',
      passed: match,
      message: match
        ? 'Date of birth matches'
        : `DOB mismatch: Document shows ${data.dateOfBirth.value}, applicant claims ${applicant.dateOfBirth}`,
    };
  }

  private static checkPassportNumberMatch(data: ExtractedData, applicant: ApplicantData): EligibilityCheck {
    const match = data.documentNumber.value === applicant.passportNumber;

    return {
      check: 'Passport Number Match',
      passed: match,
      message: match
        ? 'Passport number matches'
        : `Passport number mismatch: Document shows ${data.documentNumber.value}, applicant claims ${applicant.passportNumber}`,
    };
  }

  private static checkNationalityMatch(data: ExtractedData, applicant: ApplicantData): EligibilityCheck {
    const match = data.nationality.value === applicant.nationality;

    return {
      check: 'Nationality Match',
      passed: match,
      message: match
        ? 'Nationality matches'
        : `Nationality mismatch: Document shows ${data.nationality.value}, applicant claims ${applicant.nationality}`,
    };
  }

  private static checkAgeRequirements(
    data: ExtractedData,
    applicant: ApplicantData,
    policy: EligibilityPolicy
  ): EligibilityCheck {
    try {
      const dob = new Date(data.dateOfBirth.value);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }

      const visaTypeReq = policy.visaTypeRequirements[applicant.intendedVisaType];
      const minAge = visaTypeReq?.minAge || policy.minAge;
      const maxAge = policy.maxAge;

      const meetsAge = age >= minAge && age <= maxAge;

      return {
        check: 'Age Requirements',
        passed: meetsAge,
        message: meetsAge
          ? `Age ${age} meets requirements (${minAge}-${maxAge})`
          : `Age ${age} does not meet requirements (${minAge}-${maxAge})`,
      };
    } catch (error) {
      return {
        check: 'Age Requirements',
        passed: false,
        message: 'Unable to verify age requirements',
      };
    }
  }

  private static checkNationalityEligibility(data: ExtractedData, policy: EligibilityPolicy): EligibilityCheck {
    const nationality = data.nationality.value;

    if (policy.blockedNationalities.includes(nationality)) {
      return {
        check: 'Nationality Eligibility',
        passed: false,
        message: `Nationality ${nationality} is not eligible for visa`,
      };
    }

    if (policy.allowedNationalities.length > 0 && !policy.allowedNationalities.includes(nationality)) {
      return {
        check: 'Nationality Eligibility',
        passed: false,
        message: `Nationality ${nationality} is not in allowed list`,
      };
    }

    return {
      check: 'Nationality Eligibility',
      passed: true,
      message: `Nationality ${nationality} is eligible`,
    };
  }

  private static checkDocumentType(data: ExtractedData, policy: EligibilityPolicy): EligibilityCheck {
    const docType = data.documentType.value;
    const isAllowed = policy.requiredDocumentTypes.length === 0 || policy.requiredDocumentTypes.includes(docType);

    return {
      check: 'Document Type',
      passed: isAllowed,
      message: isAllowed
        ? `Document type ${docType} is accepted`
        : `Document type ${docType} is not accepted. Required: ${policy.requiredDocumentTypes.join(', ')}`,
    };
  }

  private static checkValidityPeriod(data: ExtractedData, policy: EligibilityPolicy): EligibilityCheck {
    try {
      const expiryDate = new Date(data.expiryDate.value);
      const today = new Date();
      const monthsValid = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30);

      const meetsRequirement = monthsValid >= policy.minValidityMonths;

      return {
        check: 'Validity Period',
        passed: meetsRequirement,
        message: meetsRequirement
          ? `Document valid for ${Math.floor(monthsValid)} months (min: ${policy.minValidityMonths})`
          : `Document only valid for ${Math.floor(monthsValid)} months, requires ${policy.minValidityMonths}`,
      };
    } catch (error) {
      return {
        check: 'Validity Period',
        passed: false,
        message: 'Unable to verify validity period',
      };
    }
  }

  private static checkVisaTypeRequirements(
    data: ExtractedData,
    applicant: ApplicantData,
    policy: EligibilityPolicy
  ): EligibilityCheck {
    const visaTypeReq = policy.visaTypeRequirements[applicant.intendedVisaType];

    if (!visaTypeReq) {
      return {
        check: 'Visa Type Requirements',
        passed: true,
        message: `No specific requirements for visa type: ${applicant.intendedVisaType}`,
      };
    }

    const nationality = data.nationality.value;
    if (visaTypeReq.allowedNationalities && !visaTypeReq.allowedNationalities.includes(nationality)) {
      return {
        check: 'Visa Type Requirements',
        passed: false,
        message: `Nationality ${nationality} not eligible for ${applicant.intendedVisaType} visa`,
      };
    }

    return {
      check: 'Visa Type Requirements',
      passed: true,
      message: `Meets all requirements for ${applicant.intendedVisaType} visa`,
    };
  }
}
