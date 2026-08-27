import { sendGAEvent } from '@next/third-parties/google';

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/;
const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

export function trackEvent(eventName, parameters = {}) {
  if (
    typeof window === 'undefined'
    || !measurementId
    || !GA_MEASUREMENT_ID_PATTERN.test(measurementId)
    || !Array.isArray(window.dataLayer)
    || typeof eventName !== 'string'
    || !eventName.trim()
  ) {
    return false;
  }

  const safeParameters = parameters && typeof parameters === 'object' && !Array.isArray(parameters)
    ? parameters
    : {};
  sendGAEvent('event', eventName.trim(), safeParameters);
  return true;
}
