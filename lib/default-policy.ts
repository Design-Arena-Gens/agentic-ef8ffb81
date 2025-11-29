import { EligibilityPolicy } from './types';

export const defaultEligibilityPolicy: EligibilityPolicy = {
  minAge: 18,
  maxAge: 120,
  allowedNationalities: [],
  blockedNationalities: ['PRK'],
  requiredDocumentTypes: ['P', 'I'],
  minValidityMonths: 6,
  visaTypeRequirements: {
    tourist: {
      minAge: 18,
      allowedNationalities: [],
      additionalRequirements: ['Valid passport', 'Proof of accommodation'],
    },
    business: {
      minAge: 21,
      allowedNationalities: [],
      additionalRequirements: ['Valid passport', 'Business invitation letter'],
    },
    student: {
      minAge: 16,
      allowedNationalities: [],
      additionalRequirements: ['Valid passport', 'Letter of acceptance from institution'],
    },
    work: {
      minAge: 18,
      allowedNationalities: [],
      additionalRequirements: ['Valid passport', 'Job offer letter', 'Work permit'],
    },
  },
};
