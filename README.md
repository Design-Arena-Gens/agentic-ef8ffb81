# AI-Powered Document Verifier

A comprehensive document verification system specialized in passports, visas, national IDs, driving licenses, and other government-issued travel documents. Built with Next.js, TypeScript, and Tesseract.js OCR.

## 🚀 Live Demo

**Production URL:** https://agentic-ef8ffb81.vercel.app

## ✨ Features

- **Multi-Document Support**: Passports, visas, national IDs, driving licenses
- **OCR Text Extraction**: Automatic extraction of all document fields
- **MRZ Validation**: Full Machine Readable Zone parsing with checksum validation
- **Document Validation**: Comprehensive checks including:
  - Document expiry verification
  - Date format and logic validation
  - Age consistency checks
  - Name and document number format validation
  - Nationality code verification
- **Visa Eligibility Assessment**: Cross-checks applicant data against configurable policies
- **Confidence Scoring**: Numeric confidence scores (0-100) for each extracted field
- **JSON API**: REST API endpoint for programmatic access
- **Real-time Results**: Instant verification with detailed feedback

## 📋 API Usage

### Endpoint

```
POST /api/verify
Content-Type: application/json
```

### Request Body

```json
{
  "imageData": "data:image/jpeg;base64,...",
  "applicantData": {
    "name": "JOHN MICHAEL SMITH",
    "dateOfBirth": "1990-05-15",
    "passportNumber": "AB1234567",
    "nationality": "USA",
    "intendedVisaType": "tourist"
  }
}
```

### Response Format

```json
{
  "overallConfidence": 92,
  "extractedData": {
    "documentType": { "value": "P", "confidence": 95 },
    "documentNumber": { "value": "AB1234567", "confidence": 95 },
    "surname": { "value": "SMITH", "confidence": 95 }
  },
  "validationChecks": [...],
  "eligibilityChecks": [...],
  "recommendedActions": [...],
  "summary": "Document verification successful..."
}
```

## 🛠️ Technology Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **OCR**: Tesseract.js
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
