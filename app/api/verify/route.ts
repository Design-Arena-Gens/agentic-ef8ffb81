import { NextRequest, NextResponse } from 'next/server';
import { OCRProcessor } from '@/lib/ocr-processor';
import { DocumentValidator } from '@/lib/document-validator';
import { ApplicantData, EligibilityPolicy, VerificationResult } from '@/lib/types';
import { defaultEligibilityPolicy } from '@/lib/default-policy';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, applicantData, eligibilityPolicy } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!applicantData) {
      return NextResponse.json(
        { error: 'Applicant data is required' },
        { status: 400 }
      );
    }

    const applicant: ApplicantData = {
      name: applicantData.name || '',
      dateOfBirth: applicantData.dateOfBirth || '',
      passportNumber: applicantData.passportNumber || '',
      nationality: applicantData.nationality || '',
      intendedVisaType: applicantData.intendedVisaType || 'tourist',
    };

    const policy: EligibilityPolicy = eligibilityPolicy || defaultEligibilityPolicy;

    const processor = new OCRProcessor();
    await processor.initialize();

    const extractedData = await processor.processDocument(imageData);

    await processor.terminate();

    const validationChecks = DocumentValidator.validateDocument(extractedData);
    const eligibilityChecks = DocumentValidator.checkEligibility(extractedData, applicant, policy);

    const allChecksPassed = [...validationChecks, ...eligibilityChecks].every(check => check.passed);

    const overallConfidence = calculateOverallConfidence(extractedData);

    const recommendedActions = generateRecommendedActions(
      validationChecks,
      eligibilityChecks,
      overallConfidence
    );

    const summary = generateSummary(
      extractedData,
      validationChecks,
      eligibilityChecks,
      overallConfidence,
      allChecksPassed
    );

    const result: VerificationResult = {
      overallConfidence,
      extractedData,
      validationChecks,
      eligibilityChecks,
      recommendedActions,
      summary,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: error.message },
      { status: 500 }
    );
  }
}

function calculateOverallConfidence(extractedData: any): number {
  const fields = Object.values(extractedData) as Array<{ confidence: number }>;
  const confidences = fields
    .filter(field => field && typeof field.confidence === 'number')
    .map(field => field.confidence);

  if (confidences.length === 0) return 0;

  const sum = confidences.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / confidences.length);
}

function generateRecommendedActions(
  validationChecks: any[],
  eligibilityChecks: any[],
  overallConfidence: number
): string[] {
  const actions: string[] = [];

  const failedValidations = validationChecks.filter(check => !check.passed);
  const failedEligibility = eligibilityChecks.filter(check => !check.passed);

  if (failedValidations.length > 0) {
    actions.push(`Review failed validation checks: ${failedValidations.map(c => c.check).join(', ')}`);
  }

  if (failedEligibility.length > 0) {
    actions.push(`Address eligibility issues: ${failedEligibility.map(c => c.check).join(', ')}`);
  }

  if (overallConfidence < 70) {
    actions.push('Request manual verification due to low confidence in extracted data');
  }

  if (overallConfidence < 85 && failedValidations.length === 0 && failedEligibility.length === 0) {
    actions.push('Consider requesting clearer document images for higher confidence');
  }

  if (failedValidations.length === 0 && failedEligibility.length === 0 && overallConfidence >= 85) {
    actions.push('Proceed with visa application - all checks passed');
  }

  if (actions.length === 0) {
    actions.push('Review application manually before proceeding');
  }

  return actions;
}

function generateSummary(
  extractedData: any,
  validationChecks: any[],
  eligibilityChecks: any[],
  overallConfidence: number,
  allChecksPassed: boolean
): string {
  const docType = extractedData.documentType.value;
  const docNum = extractedData.documentNumber.value;
  const holderName = `${extractedData.givenNames.value} ${extractedData.surname.value}`.trim();

  const failedValidations = validationChecks.filter(check => !check.passed);
  const failedEligibility = eligibilityChecks.filter(check => !check.passed);

  if (allChecksPassed && overallConfidence >= 85) {
    return `Document verification successful. ${docType} document ${docNum} for ${holderName} passed all validation and eligibility checks with ${overallConfidence}% confidence. Application is ready to proceed.`;
  }

  if (failedValidations.length > 0) {
    return `Document verification flagged issues. ${docType} document ${docNum} for ${holderName} failed ${failedValidations.length} validation check(s): ${failedValidations.map(c => c.check).join(', ')}. Manual review required.`;
  }

  if (failedEligibility.length > 0) {
    return `Eligibility check failed. ${docType} document ${docNum} for ${holderName} does not meet eligibility requirements for visa application. Failed ${failedEligibility.length} check(s): ${failedEligibility.map(c => c.check).join(', ')}.`;
  }

  if (overallConfidence < 70) {
    return `Low confidence verification. ${docType} document ${docNum} for ${holderName} extracted with only ${overallConfidence}% confidence. Request clearer images or manual verification.`;
  }

  return `Document verification completed with ${overallConfidence}% confidence. ${docType} document ${docNum} for ${holderName}. Review recommended actions before proceeding.`;
}
