'use client';

import { useState } from 'react';
import { VerificationResult } from '@/lib/types';

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    passportNumber: '',
    nationality: '',
    intendedVisaType: 'tourist',
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      if (!imagePreview) {
        throw new Error('Please upload a document image');
      }

      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: imagePreview,
          applicantData: formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Verification failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCheckColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Document Verifier
          </h1>
          <p className="text-gray-600">
            Upload government-issued travel documents for instant verification and visa eligibility check
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Document Upload</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Document preview"
                      className="w-full h-48 object-contain border border-gray-200 rounded"
                    />
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Applicant Information</h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="JOHN MICHAEL SMITH"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Passport Number
                    </label>
                    <input
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      placeholder="AB1234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nationality (3-letter code)
                    </label>
                    <input
                      type="text"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      placeholder="USA"
                      maxLength={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intended Visa Type
                    </label>
                    <select
                      name="intendedVisaType"
                      value={formData.intendedVisaType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="tourist">Tourist</option>
                      <option value="business">Business</option>
                      <option value="student">Student</option>
                      <option value="work">Work</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors"
              >
                {loading ? 'Processing...' : 'Verify Document'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Verification Results</h2>

            {!result && !loading && (
              <div className="text-center text-gray-500 py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p>Upload a document to see verification results</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Analyzing document...</p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-md">
                  <h3 className="font-semibold text-lg mb-2">Summary</h3>
                  <p className="text-gray-700">{result.summary}</p>
                  <div className="mt-3">
                    <span className="text-sm font-medium">Overall Confidence: </span>
                    <span className={`text-lg font-bold ${getConfidenceColor(result.overallConfidence)}`}>
                      {result.overallConfidence}%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Extracted Data</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(result.extractedData).map(([key, field]: [string, any]) => {
                      if (key.startsWith('mrz')) return null;
                      return (
                        <div key={key} className="bg-gray-50 p-2 rounded">
                          <div className="text-gray-600 text-xs uppercase">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                          <div className="font-medium">{field.value || 'N/A'}</div>
                          <div className={`text-xs ${getConfidenceColor(field.confidence)}`}>
                            {field.confidence}% confidence
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Validation Checks</h3>
                  <div className="space-y-2">
                    {result.validationChecks.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        <span className={`font-bold ${getCheckColor(check.passed)}`}>
                          {check.passed ? '✓' : '✗'}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{check.check}</div>
                          <div className="text-xs text-gray-600">{check.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Eligibility Checks</h3>
                  <div className="space-y-2">
                    {result.eligibilityChecks.map((check, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                        <span className={`font-bold ${getCheckColor(check.passed)}`}>
                          {check.passed ? '✓' : '✗'}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{check.check}</div>
                          <div className="text-xs text-gray-600">{check.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Recommended Actions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.recommendedActions.map((action, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Usage</h2>
          <p className="text-gray-600 mb-4">
            You can also use this verifier programmatically via our REST API:
          </p>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm">
{`POST /api/verify
Content-Type: application/json

{
  "imageData": "data:image/jpeg;base64,...",
  "applicantData": {
    "name": "JOHN MICHAEL SMITH",
    "dateOfBirth": "1990-05-15",
    "passportNumber": "AB1234567",
    "nationality": "USA",
    "intendedVisaType": "tourist"
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
