import { describe, it, expect } from 'vitest';
import { isPremiumActive } from './premium';

describe('isPremiumActive', () => {
  it('false when no entitlement', () => expect(isPremiumActive(null)).toBe(false));
  it('false when premium flag off', () => expect(isPremiumActive({ premium: false })).toBe(false));
  it('true when premium and no expiry', () => expect(isPremiumActive({ premium: true, premium_until: null })).toBe(true));
  it('true when premium and expiry in future', () => expect(isPremiumActive({ premium: true, premium_until: '2999-01-01T00:00:00Z' })).toBe(true));
  it('false when premium but expiry in past', () => expect(isPremiumActive({ premium: true, premium_until: '2000-01-01T00:00:00Z' })).toBe(false));
});
