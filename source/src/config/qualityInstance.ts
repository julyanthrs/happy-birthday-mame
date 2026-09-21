import { detectQuality } from '@/config/quality';

/** Detected once at startup. The experience never changes tier mid-story. */
export const quality = detectQuality();
